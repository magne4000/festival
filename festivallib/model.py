import os
import re
import mimetypes
from datetime import datetime
from sqlalchemy.orm import relationship, sessionmaker, scoped_session, contains_eager, joinedload
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, distinct, event, UniqueConstraint, create_engine
from sqlalchemy.sql import column
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.hybrid import hybrid_method
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.orm.query import Query
from sqlalchemy.pool import NullPool
from contextlib import contextmanager
from .thumbs import Thumb


SCHEMA_VERSION = 2


Base = declarative_base()


def coroutine(func):
    def wrapper(*arg, **kwargs):
        generator = func(*arg, **kwargs)
        next(generator)
        return generator
    return wrapper


def purge_cover_on_delete(session, query, query_context, result):
    affected_table = query_context.statement.froms[0]
    if affected_table.name == 'cover':
        deleted_elts = engine.execute(query_context.statement).fetchall()
        for elt in deleted_elts:
            if os.path.isfile(elt[2]):
                os.remove(elt[2])

def _fk_pragma_on_connect(dbapi_con, con_record):
    dbapi_con.execute('PRAGMA journal_mode = WAL')

class TypedQuery(Query):

    def __iter__(self):
        return Query.__iter__(self.typed())

    def from_self(self, *ent):
        # override from_self() to automatically apply
        # the criterion too.   this works with count() and
        # others.
        return Query.from_self(self.typed(), *ent)

    def typed(self):
        mzero = self._mapper_zero()
        if mzero is not None and hasattr(mzero.class_, 'type'):
            crit = mzero.class_.type == self.chosen_type
            return self.enable_assertions(False).filter(crit)
        else:
            return self


def get_typed_query_class(stype):
    return type('TypedTypedQuery', (TypedQuery,), dict(chosen_type=stype))


@contextmanager
def session_scope(mode='tags'):
    """Provide a transactional scope around a series of operations."""
    session = scoped_session(Session)(query_cls=get_typed_query_class(mode))
    try:
        yield session
        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()


class TypedInfo:
    type = Column(String(20), nullable=False)


class Track(Base):
    __tablename__ = "track"

    id = Column(Integer, primary_key=True)
    path = Column(Text(500), nullable=False, unique=True)
    duration = Column(Float, nullable=True)
    bitrate = Column(String(10), nullable=True)
    last_updated = Column(DateTime)
    size = Column(Integer)
    mimetype = Column(String(50))

    @hybrid_method
    def url(self):
        return 'music/%d' % self.id

    @url.expression
    def url(self):
        return column('music/', String).concat(self.id)

    def _mimetypeandsize(self, path):
        self.size = os.path.getsize(path)
        mtype, _, = mimetypes.guess_type(path)
        self.mimetype = mtype

    def __init__(self, path, duration=0, bitrate='', last_updated=''):
        self.path = path
        self._mimetypeandsize(path)
        self.duration = duration
        self.bitrate = bitrate
        self.last_updated = last_updated

    def set(self, path=None, duration=None, bitrate=None, last_updated=None):
        if path is not None:
            self.path = path
            self._mimetypeandsize(path)
        if duration is not None:
            self.duration = duration
        if bitrate is not None:
            self.bitrate = bitrate
        if last_updated is not None:
            self.last_updated = last_updated
        else:
            self.last_updated = datetime.now()

    def __repr__(self):
        return "<Track %r>" % self.path


class TrackInfo(Base, TypedInfo):
    __tablename__ = "trackinfo"

    id = Column(Integer, primary_key=True)
    name = Column(String(254), nullable=False, index=True)
    track_id = Column(Integer, ForeignKey("track.id"), nullable=False)
    track = relationship("Track", backref='infos', lazy='joined')
    album_id = Column(Integer, ForeignKey("album.id"), nullable=False)
    artist_id = Column(Integer, ForeignKey("artist.id"), nullable=False)
    genre_id = Column(Integer, ForeignKey("genre.id"), nullable=True)
    trackno = Column(Integer, nullable=True)
    year = Column(Integer, nullable=True)
    UniqueConstraint('track_id', 'type')

    def _asdict(self, genre=False, album=False):
        return {
            'id': self.track_id,
            'genre_id': self.genre_id,
            'album_id': self.album_id,
            'genre': self.genre._asdict() if (genre and 'genre' in self.__dict__) else None,
            'album': self.album._asdict(artist=False) if (album and 'album' in self.__dict__) else None,
            'album_name': self.album.name,
            'artist_name': self.artist.name,
            'name': self.name,
            'duration': self.track.duration,
            'bitrate': self.track.bitrate,
            'trackno': self.trackno,
            'url': self.track.url()
        }

    def __repr__(self):
        return "<TrackInfo %r %r>" % (self.type, self.track.path)


class Artist(Base, TypedInfo):
    __tablename__ = "artist"

    id = Column(Integer, primary_key=True)
    name = Column(String(254), nullable=False, index=True)
    albums = relationship("Album", backref="artist", innerjoin=True)
    tracks = relationship("TrackInfo", backref="artist", innerjoin=True)
    UniqueConstraint('name', 'type')

    @hybrid_method
    def album_count(self):
        if 'albums' in self.__dict__:
            return len(self.albums)
        return 0

    def __repr__(self):
        return "<Artist %r %r>" % (self.type, self.name)

    def _asdict(self, albums=False, tracks=False):
        return {
            'id': self.id,
            'name': self.name,
            'albums': [x._asdict(tracks=tracks) for x in self.albums] if (albums and 'albums' in self.__dict__) else None
        }


class Album(Base, TypedInfo):
    __tablename__ = "album"

    id = Column(Integer, primary_key=True)
    artist_id = Column(Integer, ForeignKey("artist.id"), nullable=False)
    name = Column(String(254), nullable=False, index=True)
    year = Column(Integer, nullable=True)
    cover_id = Column(Integer, ForeignKey("cover.id"), nullable=True)
    cover = relationship("Cover", backref="albums")
    tracks = relationship("TrackInfo", backref="album", innerjoin=True)
    last_updated = Column(DateTime)
    UniqueConstraint('name', 'type')

    @hybrid_method
    def track_count(self):
        if 'tracks' in self.__dict__:
            return len(self.tracks)
        return 0

    @hybrid_method
    def duration(self):
        if 'tracks' in self.__dict__:
            return sum((tr.duration for tr in self.tracks))
        return 0

    def __repr__(self):
        return "<Album %r %r.%r>" % (self.type, self.artist_id, self.name)

    def _asdict(self, artist=False, tracks=False):
        return {
            'id': self.id,
            'artist_id': self.artist_id,
            'artist': self.artist._asdict() if (artist and 'artist' in self.__dict__) else None,
            'name': self.name,
            'year': self.year,
            'tracks': [x._asdict() for x in self.tracks] if (tracks and 'tracks' in self.__dict__) else None
        }


class Cover(Base):
    __tablename__ = "cover"

    id = Column(Integer, primary_key=True)
    mbid = Column(String(254), nullable=True)
    path = Column(String(254), nullable=True, unique=True)


class Genre(Base, TypedInfo):
    __tablename__ = "genre"

    id = Column(Integer, primary_key=True)
    name = Column(String(254), nullable=False, unique=True)
    tracks = relationship("TrackInfo", backref="genre")
    UniqueConstraint('name', 'type')

    def __repr__(self):
        return "<Genre %r %r>" % (self.type, self.name)

    def _asdict(self):
        return {
            'id': self.id,
            'name': self.name
        }


def _clean_tag(tag, allow_none=False, mytype='string', default=None, max_len=254):
    """ Clean the given `tag` instance depending of its `mytype`."""
    if default is None and allow_none is False:
        if mytype == 'string':
            default = 'unknown'
        elif mytype == 'integer':
            default = 0
        elif mytype == 'float':
            default = 0.0

    if tag is None or tag == 'None':
        return default if allow_none is False else None

    if mytype == 'string':
        try:
            tag = str(tag).strip()
        except UnicodeDecodeError:
            tag = tag.strip()
    else:
        tag = str(tag)
    if tag == '':
        return default
    elif mytype == 'integer' and re.match(r'\d{1,32}', str(tag)) is None:
        return default
    elif mytype == 'float':
        try:
            return float(tag)
        except ValueError:
            return default
    return tag[:max_len].strip()


class Context:

    def __init__(self, load=False, expire_on_commit=True):
        self.load = load
        self.expire_on_commit = expire_on_commit

    def __enter__(self):
        self.session = Session(expire_on_commit=self.expire_on_commit)
        self.infos = {}
        if self.load:
            self.tracks = [x.path for x in self.session.query(Track.path).all()]
            for mode in app.config['SCANNER_MODES']:
                self.infos[mode] = {}
                self.infos[mode]['artists'] = {x.name.strip().lower(): x for x in self.session.query(Artist).join(Artist.albums).options(contains_eager(Artist.albums)).filter(Artist.type == mode).all()}
                self.infos[mode]['genres'] = {x.name.strip().lower(): x for x in self.session.query(Genre).filter(Artist.type == mode).all()}
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        if exc_type is None:
            self.session.commit()
        else:
            self.session.rollback()
        self.session.close()

    def get_null_cover(self):
        obj = None
        try:
            obj = self.session.query(Cover).filter(Cover.mbid == '0').one()
        except NoResultFound:
            obj = Cover(mbid='0')
            self.session.add(obj)
        return obj

    def get_cover_by_mbid(self, mbid):
        try:
            return self.session.query(Cover).filter(Cover.mbid == mbid).one()
        except NoResultFound:
            return None

    def delete_orphans(self):
        self.session.query(Genre).filter(~Genre.id.in_(self.session.query(distinct(TrackInfo.genre_id)))).delete(False)
        self.session.commit()
        self.session.query(Album).filter(~Album.id.in_(self.session.query(distinct(TrackInfo.album_id)))).delete(False)
        self.session.commit()
        self.session.query(Cover).filter(~Cover.id.in_(self.session.query(distinct(Album.cover_id)))).delete(False)
        self.session.commit()
        self.session.query(Artist).filter(~Artist.id.in_(self.session.query(distinct(Album.artist_id)))).delete(False)
        self.session.commit()

    def purge_downloaded_covers(self):
        path_covers = {cover.path for cover in self.session.query(Cover.path).all()}
        thumbs_root = Thumb.getdir()
        if os.path.isdir(thumbs_root):
            for fname in os.listdir(thumbs_root):
                fpath = os.path.join(thumbs_root, fname)
                if fpath not in path_covers:
                    if os.path.isfile(fpath):
                        os.remove(fpath)

    def delete_tracks(self, tracks_path):
        tracks = self.session.query(Track).join(Track.infos).filter(Track.path.in_(tracks_path)).options(joinedload(Track.infos)).all()
        for track in tracks:
            for trackinfo in track.infos:
                self.session.delete(trackinfo)
            self.session.delete(track)
        self.session.commit()

    def add_track_full(self, filepath, mtime, tags, info):
        track = self.add_track(
            filepath,
            info['length'] if 'length' in info else None,
            info['bitrate'] if 'bitrate' in info else None,
            mtime
        )
        for mode in tags:
            self.add_track_info(track, mode, **tags[mode])
        self.session.flush()
        return track

    def fetch_genre(self, mode, genre):
        if genre is None:
            return None
        genre = _clean_tag(genre)
        lgenre = genre.lower()
        if lgenre in self.infos[mode]['genres']:
            ge = self.infos[mode]['genres'][lgenre]
        else:
            ge = Genre(name=genre, type=mode)
            self.infos[mode]['genres'][lgenre] = ge
        return ge

    def get_albums_without_cover(self, fetch_mbid_0=False):
        if fetch_mbid_0:
            cover = self.get_cover_by_mbid(0)
            if cover is not None:
                yield from self.session.query(Album).filter(Album.cover == cover).all()
        yield from self.session.query(Album).filter(Album.cover_id == None).all()

    def get_album_path(self, album):
        res = self.session.query(Track.path).join(TrackInfo).filter(TrackInfo.album_id == album.id).first()
        return os.path.dirname(res[0]) if len(res) > 0 else None

    def fetch_album(self, mode, artist, album, year=None):
        artistclean = artist.strip().lower()
        if artistclean in self.infos[mode]['artists']:
            ar = self.infos[mode]['artists'][artistclean]
        else:
            ar = Artist(name=artist, type=mode)
            self.infos[mode]['artists'][artistclean] = ar
            self.session.add(ar)
        albums = {a.name.strip().lower(): a for a in ar.albums}
        albumclean = album.strip().lower()
        if albumclean in albums:
            return albums[albumclean]
        else:
            al = Album(name=album, artist=ar, year=year, type=mode)
            self.session.add(al)
            return al

    def add_track_info(self, track, mode, artist=None, album=None, title=None, trackno=None, year=None, genre=None):
        found = False
        name = _clean_tag(title)
        artist = _clean_tag(artist)
        album = _clean_tag(album)
        year = _clean_tag(year, mytype='integer', max_len=4)
        if trackno is not None:
            trackno = trackno.split("/")[0]
        trackno = _clean_tag(trackno, mytype='integer')
        trackinfo = None

        for trackinfo in track.infos:
            if trackinfo.type == mode:
                found = True
                break
        if not found:
            trackinfo = TrackInfo(type=mode)
            track.infos.append(trackinfo)
        trackinfo.name = name
        trackinfo.year = year
        trackinfo.trackno = trackno
        trackinfo.genre = self.fetch_genre(mode, genre)
        trackinfo.album = self.fetch_album(mode, artist, album, year)
        trackinfo.artist = trackinfo.album.artist
        if trackinfo.album.last_updated is None or trackinfo.album.last_updated < track.last_updated:
            trackinfo.album.last_updated = track.last_updated
        return trackinfo

    def add_track(self, path, duration=0.0, bitrate=None, last_mod_time=None):
        duration = _clean_tag(duration, mytype='float')
        bitrate = _clean_tag(bitrate, allow_none=True)

        if path in self.tracks:
            track = self.session.query(Track).filter(Track.path == path).one()
            track.set(path, duration, bitrate, last_mod_time)
            self.session.merge(track)
        else:
            track = Track(path, duration, bitrate, last_mod_time)
            self.session.add(track)

        return track


from app import app

engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'], poolclass=NullPool, connect_args={'check_same_thread': False})
if app.config['SQLALCHEMY_DATABASE_URI'].startswith('sqlite://'):
    event.listen(engine, 'connect', _fk_pragma_on_connect)
mimetypes.init()
Session = sessionmaker(bind=engine)
event.listen(Session, "after_bulk_delete", purge_cover_on_delete)
Base.metadata.create_all(bind=engine)
