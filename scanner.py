#!/usr/bin/env python3
import sys
sys.path.insert(0, './libs')
import os
import uuid
import logging
import time
import re
from collections import defaultdict
from threading import Thread, Timer
from datetime import datetime
from festivallib.model import Context, Track, Cover, session_scope, coroutine
from festivallib import coverurl, thumbs, info
from libs.mediafile import MediaFile, UnreadableFileError
from app import app

logger = logging.getLogger('scanner')
filter_cover = lambda fname: re.compile('(cover|folder|album|thumb)\.(jpg|gif)', re.I).match(fname)


class CoverThread(Thread):

    def __init__(self, debug=False):
        super(CoverThread, self).__init__()
        self.cu = coverurl.CoverURL(app.config['LASTFM_API_KEY'])
        self.debug = debug

    def print_debug(self, char):
        if self.debug:
            sys.stdout.write(char)
            sys.stdout.flush()

    def rescan_albums_without_cover(self):
        last_cover_scan = info.Infos.get('last_cover_scan')
        if last_cover_scan is not None:
            return last_cover_scan + app.config['COVERS_FETCH_ONLINE_INTERVAL'] <= datetime.now()
        return False

    def update_last_cover_scan(self):
        info.Infos.update(last_cover_scan=datetime.now())

    def run_fetch_online(self, db, null_cover, album):
        mbid, url = self.cu.search(album.artist.name, album.name)
        res = None
        if mbid is not None and len(mbid) > 0:
            res = db.get_cover_by_mbid(mbid)
        if res:
            album.cover = res
            self.print_debug('_')
        else:
            cover = self.cu.download(url, self.save)
            if cover is not None:
                cover.mbid = mbid
                album.cover = cover
                self.print_debug('x')
            else:
                album.cover = null_cover
                self.print_debug('-')

    def run_fetch_local(self, db, null_cover, album):
        dirname = db.get_album_path(album)
        try:
            fname = next(filter(filter_cover, os.listdir(dirname)))
            fpath = os.path.join(dirname, fname)
            cover = self.save(fpath)
            if cover is not None:
                album.cover = cover
            else:
                album.cover = null_cover
        except StopIteration:
            album.cover = null_cover

    def run(self):
        with Context(expire_on_commit=False) as db:
            albums = db.get_albums_without_cover(self.rescan_albums_without_cover())
            null_cover = db.get_null_cover()
            for album in albums:
                for val in app.config['COVERS_FETCH']:
                    getattr(self, 'run_fetch_%s' % val)(db, null_cover, album)
                    if album.cover != null_cover:
                        break
                db.session.commit()
        self.update_last_cover_scan()

    @staticmethod
    def save(fd):
        if fd is not None:
            thumb = thumbs.Thumb()
            path = thumb.create(fd, uuid.uuid4())
            cover = Cover(path=path)
            return cover
        return None


class Scanner(Thread):

    def __init__(self, root, fetch_covers=True, infinite=True, debug=False):
        super(Scanner, self).__init__()
        self.root = root
        self.progress_timeout = None
        self.scan_in_progess = False
        self.rescan_after = False
        self.tracks = {}
        self.debug = debug
        self.fetch_covers = fetch_covers
        self.infinite = infinite

    def init_tracks(self):
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
        logger.debug('Purging %d old tracks', len(self.tracks))
        with Context() as db:
            if len(self.tracks) > 0:
                db.delete_tracks(list(self.tracks.keys()))
            db.delete_orphans()
            db.purge_downloaded_covers()

    def get_tags_and_info(self, mfile):
        tags = {}
        info = {}
        try:
            mutagen_tags = MediaFile(mfile)
            tags['title'] = mutagen_tags.title
            tags['artist'] = mutagen_tags.artist if mutagen_tags.artist is not None else 'Unknown'
            tags['genre'] = mutagen_tags.genre
            tags['album'] = mutagen_tags.album if mutagen_tags.album is not None else 'Unknown'
            tags['trackno'] = mutagen_tags.track
            tags['year'] = mutagen_tags.year
            info['length'] = mutagen_tags.length
            info['bitrate'] = mutagen_tags.bitrate
        except UnreadableFileError as e:
            logger.exception('Error in scanner.get_tags_and_info')
        return tags, info

    def get_tags_from_folders(self, mfile):
        tags = {}
        for pattern in app.config['SCANNER_FOLDER_PATTERNS']:
            match = pattern.search(mfile)
            if match is not None:
                try:
                    if all((match.group(key) for key in ['artist', 'album', 'title'])):  # 'artist', 'album' and 'title' groups are mandatory
                        for key in ['artist', 'album', 'title', 'year', 'trackno']:
                            try:
                                if match.group(key) is not None:
                                    tags[key] = match.group(key)
                            except IndexError:
                                pass
                except IndexError:
                    pass
        return tags

    @coroutine
    def add_track(self):
        with Context(True) as db:
            try:
                while True:
                    mfile, mtime, = (yield)
                    tags = {}
                    info = {}
                    if 'tags' in app.config['SCANNER_MODES']:
                        tags['tags'], info = self.get_tags_and_info(mfile)
                    if 'folder' in app.config['SCANNER_MODES']:
                        tags_from_folders = self.get_tags_from_folders(mfile)
                        if tags_from_folders is not None:
                            tags['folder'] = tags_from_folders
                    try:
                        _ = db.add_track_full(mfile, mtime, tags, info)
                    except Exception as e:
                        db.session.rollback()
                        logger.exception('Error in scanner.add_track: %s\nTags: %s', mfile, tags)
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
                    sys.stdout.write('+')
                elif self.debug:
                    sys.stdout.write('.')
                sys.stdout.flush()
        except GeneratorExit:
            pass
        h.close()

    @staticmethod
    def filter_music_file(path):
        return os.path.splitext(path)[1].lower() in app.config['SCANNER_EXTS']

    def _run(self):
        logger.debug('New scan started')
        self.walk()
        logger.debug('Scan finished')
        if self.fetch_covers:
            logger.debug('Starting cover thread')
            t = CoverThread(debug=self.debug)
            t.start()
            t.join()
            logger.debug('Cover thread terminated')
        if self.infinite:
            t = Timer(app.config['SCANNER_REFRESH_INTERVAL'].total_seconds(), self._run)
            t.start()

    def run(self):
        self._run()

    def update_last_scan(self):
        info.Infos.update(last_scan=datetime.now())

    def walk(self, purge=True):
        h = self.handle()
        for self.root, _, files in os.walk(self.root, topdown=False):
            for name in files:
                if self.filter_music_file(name):
                    h.send(os.path.join(self.root, name))
        h.close()
        if purge:
            self.purgeold()
        self.tracks = {}
        self.update_last_scan()


class ScannerTestRegex(Scanner):

    def init_tracks(self):
        self.tracks = {}
        self.treeview = defaultdict(dict)
        self.unable_to_scan = []

    def print_info(self):

        def printmsg(x):
            print()
            print('#'*len(x))
            print(x)
            print('#'*len(x))
            print()

        def printw(x, y):
            print('\033[93m/!\\\033[0m', x, y)

        printmsg('Successfully')
        for artist, albums in self.treeview.items():
            print(artist)
            for album, tracks in albums.items():
                print(' ', album)
                max_len = max(map(len, [track[0] for track in tracks]))
                for title, mfile, in tracks:
                    print('   ', title.ljust(max_len, ' '), mfile)
        if len(self.unable_to_scan) > 0:
            printmsg('Errors')
            for mfile, tags in self.unable_to_scan:
                printw(mfile, tags)
        else:
            printmsg("All files matched")

    @coroutine
    def add_track(self):
        try:
            while True:
                mfile, _, = (yield)
                tags = self.get_tags_from_folders(mfile)
                if len(tags) >= 3:
                    self.treeview[tags['artist']].setdefault(tags['album'], []).append((tags['title'], mfile))
                else:
                    self.unable_to_scan.append((mfile, tags))
        except GeneratorExit:
            pass
        self.print_info()

    def _run(self):
        self.walk(purge=False)

if __name__ == "__main__":
    while True:
        s = Scanner(app.config['SCANNER_PATH'], infinite=False, debug='-d' in sys.argv)
        s.start()
        s.join()
        time.sleep(app.config['SCANNER_REFRESH_INTERVAL'].total_seconds())
