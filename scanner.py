#!/usr/bin/env python3
import sys
sys.path.insert(0, './libs')
import os
import uuid
import logging
import time
from queue import Queue, Empty
from threading import Thread, Event, Timer
from datetime import datetime
from festivallib.model import Context, Track, session_scope
from festivallib import coverurl, thumbs
from libs.mediafile import MediaFile, UnreadableFileError
from flask import render_template
from app import app

logger = logging.getLogger('scanner')

def filter_music_file(path):
    return os.path.splitext(path)[1].lower() in app.config['SCANNER_EXTS']

def coroutine(func):
    def wrapper(*arg, **kwargs):
        generator = func(*arg, **kwargs)
        next(generator)
        return generator
    return wrapper

class CoverThread(Thread):
    
    def __init__(self, debug=False):
        super(CoverThread, self).__init__()
        self.debug = debug
    
    def run(self):
        self.cu = coverurl.CoverURL(app.config['LASTFM_API_KEY'])
        with Context() as db:
            albums = db.get_albums_without_cover()
            for album in albums:
                path = self.cu.download(album.artist.name, album.name, self.save)
                db.update_albumart(album, path)
                if self.debug:
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

class Scanner(Thread):
    
    def __init__(self, root, infinite=True, debug=False):
        super(Scanner, self).__init__()
        self.root = root
        self.progress_timeout = None
        self.scan_in_progess = False
        self.rescan_after = False
        self.tracks = {}
        self.debug = debug
        self.infinite = infinite
    
    def init_tracks(self):
        self.tracks = {}
        with session_scope() as session:
            self.tracks = {x.path: x.last_updated for x in session.query(Track.path, Track.last_updated).all()}
    
    def scan(self, mfile):
        res = True
        stats = os.stat(mfile)
        last_mod_time = datetime.fromtimestamp(stats.st_mtime)
        if mfile in self.tracks:
            if self.tracks[mfile] is not None and last_mod_time <= self.tracks[mfile]:
                res = False
            del self.tracks[mfile]
        return res, last_mod_time
    
    def purgeold(self):
        logger.debug('Purging %d old tracks' % len(self.tracks))
        if len(self.tracks) > 0:
            with Context() as db:
                db.delete_tracks(list(self.tracks.keys()))
                db.delete_orphans()
    
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
                        if self.debug:
                            sys.stdout.write('*')
                            sys.stdout.flush()
                    except UnreadableFileError as e:
                        logger.exception('Error in scanner.add_track')
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
                elif self.debug:
                    sys.stdout.write('.')
                    sys.stdout.flush()
        except GeneratorExit:
            self.tracks = {}
    
    def _run(self):
        logger.debug('New scan started')
        self.walk()
        logger.debug('Scan finished')
        logger.debug('Starting cover thread')
        t = CoverThread(debug=self.debug)
        t.start()
        t.join()
        logger.debug('Cover thread terminated')
        if self.infinite:
            t = Timer(app.config['SCANNER_REFRESH_INTERVAL'], self._run)
            t.start()
    
    def run(self):
        self._run()
    
    def walk(self):
        h = self.handle()
        for self.root, _, files in os.walk(self.root, topdown=False):
            for name in files:
                if filter_music_file(name):
                    h.send(os.path.join(self.root, name))
        self.purgeold()

if __name__ == "__main__":
    while True:
        s = Scanner(app.config['SCANNER_PATH'], infinite=False, debug='-d' in sys.argv)
        s.start()
        s.join()
        time.sleep(app.config['SCANNER_REFRESH_INTERVAL'])