#!/usr/bin/env python3
from datetime import datetime
from model.model import update_albumart, add_track, Track, session_scope
import sys
sys.path.append('./libs')
import mutagen
import os
from queue import Queue
from threading import Thread
import uuid
import traceback
from lib import coverurl, thumbs
from flask import Flask, render_template
app = Flask(__name__)
app.config.from_pyfile('settings.cfg')

def filter_music_file(path):
    return os.path.splitext(path)[1].lower() in app.config['SCANNER_EXTS']

def coroutine(func):
    def wrapper(*arg, **kwargs):
        generator = func(*arg, **kwargs)
        next(generator)
        return generator
    return wrapper

class CoverThread(Thread):
    
    q = Queue()
    
    def run(self):
        self.cu = coverurl.CoverURL(app.config['LASTFM_API_KEY'])
        album_ids = []
        while True:
            album = CoverThread.q.get()
            if album.id not in album_ids:
                path = self.cu.download(album.artist.name, album.name, self.save)
                update_albumart(album, path)
                album_ids.append(album.id)
            CoverThread.q.task_done()
        CoverThread.q.join()
    
    def save(self, fd):
        if fd is not None:
            thumb = thumbs.Thumb()
            path = thumb.create(fd, uuid.uuid4())
            print("Successfully saved thumb", path)
            return path
        return None

class Scanner(object):
    
    def __init__(self):
        self.progress_timeout = None
        self.scan_in_progess = False
        self.rescan_after = False
        self.tracks = {}
    
    def init_tracks(self):
        self.tracks = {}
        with session_scope() as session:
            for track in session.query(Track).all():
                self.tracks[track.path] = track.last_updated
    
    def scan(self, mfile):
        stats = os.stat(mfile)
        last_mod_time = datetime.fromtimestamp(stats.st_mtime)
        if mfile in self.tracks:
            if self.tracks[mfile] is not None and self.tracks[mfile] >= last_mod_time:
                del self.tracks[mfile]
                return False, last_mod_time
        return True, last_mod_time
    
    @coroutine
    def add_track(self):
        while True:
            mfile, mtime, = (yield)
            try:
                mutagen_tags = mutagen.File(mfile, easy=True)
                tags = {}
                try:
                    tags['title'] = mutagen_tags['title'][0]
                except KeyError:
                    tags['title'] = os.path.basename(mfile).rsplit('.', 1)[0].lower()
                try:
                    tags['artist'] = mutagen_tags['artist'][0]
                except KeyError:
                    tags['artist'] = 'Unknown'
                try:
                    tags['genre'] = mutagen_tags['genre'][0]
                except KeyError:
                    tags['genre'] = 'Other'
                try:
                    tags['album'] = mutagen_tags['album'][0]
                except KeyError:
                    tags['album'] = 'Unknown'
                try:
                    tags['tracknumber'] = mutagen_tags['tracknumber'][0].split('/')[0]
                except KeyError:
                    tags['tracknumber'] = None
                try:
                    tags['year'] = mutagen_tags['date'][0]
                    if len(tags['year']) > 4:
                        tags['year'] = tags['year'][:4]
                except KeyError:
                    tags['year'] = None
                track = add_track(
                    tags['title'],
                    mfile,
                    tags['artist'],
                    tags['genre'],
                    tags['album'],
                    tags['tracknumber'],
                    tags['year'],
                    mutagen_tags.info.length,
                    mutagen_tags.info.bitrate,
                    mutagen_tags.info.sample_rate,
                    mtime
                )
                #print("Succesfully added/updated %s" % mfile)
                print('.', end='')
                CoverThread.q.put(track.album)
            except Exception as e:
                print('Error in scanner.add_track', file=sys.stderr)
                print(traceback.format_exc(), file=sys.stderr)
    
    @coroutine
    def handle(self):
        h = self.add_track()
        self.init_tracks()
        try:
            while True:
                mfile = (yield)
                should_add, mtime = self.scan(mfile)
                if should_add:
                    h.send((mfile, mtime))
        except GeneratorExit:
            self.tracks = {}
    
    def walk(self, root):
        h = self.handle()
        ct = CoverThread()
        ct.start()
        for root, _, files in os.walk(root):
            for name in files:
                if filter_music_file(name):
                    h.send(os.path.join(root, name))
        #ct.join()

if __name__ == "__main__":
    s = Scanner()
    s.walk('/mnt/data/musique/')