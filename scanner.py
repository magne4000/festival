#!/usr/bin/env python3
from datetime import datetime
from lib.model import Context, Track, session_scope
import sys
sys.path.append('./libs')
from libs.mediafile import MediaFile, UnreadableFileError
import os
from queue import Queue, Empty
from threading import Thread, Timer, Event
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


def set_interval(interval, times = -1):
    # This will be the actual decorator,
    # with fixed interval and times parameter
    def outer_wrap(function):
        # This will be the function to be
        # called
        def wrap(*args, **kwargs):
            stop = Event()
            # This is another function to be executed
            # in a different thread to simulate setInterval
            def inner_wrap():
                i = 0
                while i != times and not stop.isSet():
                    stop.wait(interval)
                    function(*args, **kwargs)
                    i += 1

            t = Timer(0, inner_wrap)
            t.daemon = True
            t.start()
            return stop
        return wrap
    return outer_wrap

class CoverThread(Thread):
    
    def run(self):
        self.cu = coverurl.CoverURL(app.config['LASTFM_API_KEY'])
        with Context() as db:
            albums = db.get_albums_without_cover()
            for album in albums:
                path = self.cu.download(album.artist.name, album.name, self.save)
                db.update_albumart(album, path)
                if path is None:
                    sys.stdout.write('-')
                    sys.stdout.flush()
                else:
                    sys.stdout.write('x')
                    sys.stdout.flush()
    
    def save(self, fd):
        if fd is not None:
            thumb = thumbs.Thumb()
            path = thumb.create(fd, uuid.uuid4())
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
            self.tracks = {x.path: x.last_updated for x in session.query(Track.path, Track.last_updated).all()}
    
    def scan(self, mfile):
        stats = os.stat(mfile)
        last_mod_time = datetime.fromtimestamp(stats.st_mtime)
        if mfile in self.tracks and self.tracks[mfile] is not None and last_mod_time <= self.tracks[mfile]:
            return False, last_mod_time
        return True, last_mod_time
    
    @coroutine
    def add_track(self):
        with Context(True) as db:
            try:
                while True:
                    mfile, mtime, = (yield)
                    try:
                        mutagen_tags = MediaFile(mfile)
                        tags = {}
                        info = {}
                        tags['title'] = mutagen_tags.title
                        tags['artist'] = mutagen_tags.artist if mutagen_tags.artist is not None else 'Unknown'
                        tags['genre'] = mutagen_tags.genre
                        tags['album'] = mutagen_tags.album if mutagen_tags.album is not None else 'Unknown'
                        tags['tracknumber'] = mutagen_tags.track
                        tags['year'] = mutagen_tags.year
                        info['length'] = mutagen_tags.length
                        info['bitrate'] = mutagen_tags.bitrate
                        track = db.add_track_full(mfile, mtime, tags, info)
                        sys.stdout.write('*')
                        sys.stdout.flush()
                    except UnreadableFileError as e:
                        print('Error in scanner.add_track', file=sys.stderr)
                        print(traceback.format_exc(), file=sys.stderr)
            except GeneratorExit:
                pass
    
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
                else:
                    sys.stdout.write('.')
                    sys.stdout.flush()
        except GeneratorExit:
            self.tracks = {}
    
    @set_interval(300.0)
    def start(self, root):
        self.walk(root)
        t = CoverThread()
        t.start()
        t.join()
    
    def walk(self, root):
        h = self.handle()
        for root, _, files in os.walk(root, topdown=False):
            for name in files:
                if filter_music_file(name):
                    h.send(os.path.join(root, name))

if __name__ == "__main__":
    s = Scanner()
    s.walk('/mnt/data/musique/')
    t = CoverThread()
    t.start()
    t.join()