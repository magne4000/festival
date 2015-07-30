import os
import re
import mimetypes
from datetime import datetime
from sqlalchemy.orm import relationship, sessionmaker, scoped_session
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, create_engine, distinct, event
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.sql import column
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method
from sqlalchemy.pool import NullPool
from contextlib import contextmanager
from app import app

engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'], poolclass=NullPool, connect_args={'check_same_thread': False})

mimetypes.init()

Base = declarative_base()

Session = scoped_session(sessionmaker(bind=engine))


def coroutine(func):
    def wrapper(*arg, **kwargs):
        generator = func(*arg, **kwargs)
        next(generator)
        return generator
    return wrapper


def purge_cover_on_delete(session, query, query_context, result):
    affected_table = query_context.statement.froms[0]
    if affected_table.name == 'album':
        deleted_elts = engine.execute(query_context.statement).fetchall()
        for elt in deleted_elts:
            if os.path.isfile(elt[4]):
                os.remove(elt[4])

event.listen(Session, "after_bulk_delete", purge_cover_on_delete)


@contextmanager
def session_scope():
    """Provide a transactional scope around a series of operations."""
    session = Session()
    try:
        yield session
        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()


class Track(Base):
    __tablename__ = "track"
    
    id = Column(Integer, primary_key=True)
    path = Column(Text(500), nullable=False)
    genre_id = Column(Integer, ForeignKey("genre.id"))
    album_id = Column(Integer, ForeignKey("album.id"))
    name = Column(String(254), nullable=False, index=True)
    duration = Column(Float, nullable=True)
    year = Column(Integer, nullable=True)
    bitrate = Column(String(10), nullable=True)
    trackno = Column(Integer, nullable=True)
    last_updated = Column(DateTime)
    size = Column(Integer)
    mimetype = Column(String(50))
    album_name = association_proxy('album', 'name')
    
    @hybrid_property
    def artist_name(self):
        if self.album and 'artist' in self.album.__dict__:
            return self.album.artist.name
        return None
    
    @hybrid_property
    def genre_name(self):
        if 'genre' in self.__dict__ and self.genre is not None:
            return self.genre.name
        return None
    
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
    
    def __init__(self, name, path, trackno='', year=0, duration=0, bitrate='', last_updated=''):
        self.name = name
        self.path = path
        self._mimetypeandsize(path)
        self.duration = duration
        self.year = year
        self.bitrate = bitrate
        self.trackno = trackno
        self.last_updated = last_updated
    
    def set(self, name=None, path=None, trackno=None, year=None, duration=None, bitrate=None, last_updated=None):
        if name is not None:
            self.name = name
        if path is not None:
            self.path = path
            self._mimetypeandsize(path)
        if duration is not None:
            self.duration = duration
        if year is not None:
            self.year = year
        if bitrate is not None:
            self.bitrate = bitrate
        if trackno is not None:
            self.trackno = trackno
        if last_updated is not None:
            self.last_updated = last_updated
        else:
            self.last_updated = datetime.now()
    
    def __repr__(self):
        return "<Track %r>" % self.path
    
    def _asdict(self, genre=False, album=False):
        return {
            'id': self.id,
            'genre_id': self.genre_id,
            'album_id': self.album_id,
            'genre': self.genre._asdict() if (genre and 'genre' in self.__dict__) else None,
            'album': self.album._asdict(artist=False) if (album and 'album' in self.__dict__) else None,
            'album_name': self.album_name,
            'artist_name': self.artist_name,
            'name': self.name,
            'duration': self.duration,
            'bitrate': self.bitrate,
            'trackno': self.trackno,
            'url': self.url()
        }


class Artist(Base):
    __tablename__ = "artist"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(254), nullable=False, unique=True, index=True)
    albums = relationship("Album", backref="artist", innerjoin=True)
    
    @hybrid_method
    def album_count(self):
        if 'albums' in self.__dict__:
            return len(self.albums)
        return 0
    
    def __init__(self, name):
        self.name = name
    
    def __repr__(self):
        return "<Artist %r>" % self.name
    
    def _asdict(self, albums=False, tracks=False):
        return {
            'id': self.id,
            'name': self.name,
            'albums': [x._asdict(tracks=tracks) for x in self.albums] if (albums and 'albums' in self.__dict__) else None
        }


class Album(Base):
    __tablename__ = "album"
    
    id = Column(Integer, primary_key=True)
    artist_id = Column(Integer, ForeignKey("artist.id"), nullable=False)
    name = Column(String(254), nullable=False, index=True)
    year = Column(Integer, nullable=True)
    albumart = Column(String(254), nullable=True)
    tracks = relationship("Track", backref="album", innerjoin=True)
    
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
        return "<Album %r.%r>" % (self.artist_id, self.name)
    
    def _asdict(self, artist=False, tracks=False):
        return {
            'id': self.id,
            'artist_id': self.artist_id,
            'artist': self.artist._asdict() if (artist and 'artist' in self.__dict__) else None,
            'name': self.name,
            'year': self.year,
            'tracks': [x._asdict() for x in self.tracks] if (tracks and 'tracks' in self.__dict__) else None
        }


class Genre(Base):
    __tablename__ = "genre"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(254), nullable=False, unique=True)
    tracks = relationship("Track", backref="genre")
    
    def __init__(self, name):
        self.name = name
    
    def __repr__(self):
        return "<Genre %r>" % self.name
    
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
    if tag == '':
        return default
    elif mytype == 'integer' and re.match(r'\d{1,32}', tag) is None:
        return default
    elif mytype == 'float':
        try:
            return float(tag)
        except ValueError:
            return default
    return tag[:max_len].strip()


class Context:
    
    def __init__(self, load=False):
        self.load = load
    
    def __enter__(self):
        self.session = Session()
        if self.load:
            self.tracks = {x.path: x.id for x in self.session.query(Track.path, Track.id).all()}
            self.artists = {x.name.strip().lower(): x for x in self.session.query(Artist).all()}
            self.genres = {x.name.strip().lower(): x for x in self.session.query(Genre).all()}
        return self
    
    def __exit__(self, exc_type, exc_value, traceback):
        if exc_type is None:
            self.session.commit()
        else:
            self.session.rollback()
        self.session.close()
    
    def update_albumart(self, album, path):
        if path is None:
            path = "-"
        album.albumart = path
        self.session.commit()
    
    def delete_orphans(self):
        self.session.query(Genre).filter(~Genre.id.in_(self.session.query(distinct(Track.genre_id)))).delete(False)
        self.session.query(Album).filter(~Album.id.in_(self.session.query(distinct(Track.album_id)))).delete(False)
        self.session.query(Artist).filter(~Artist.id.in_(self.session.query(distinct(Album.artist_id)))).delete(False)
        self.session.commit()
    
    def delete_tracks(self, tracks):
        self.session.query(Track).filter(Track.path.in_(tracks)).delete(False)
        self.session.commit()
    
    def add_track_full(self, filepath, mtime, tags, info):
        track = self.add_track(
            filepath,
            tags['title'],
            tags['tracknumber'],
            tags['year'],
            info['length'],
            info['bitrate'],
            mtime
        )
        track.genre = self.fetch_genre(tags['genre'])
        track.album = self.fetch_album(tags['artist'], tags['album'], tags['year'])
        self.session.flush()
        return track
    
    def fetch_genre(self, genre):
        if genre is None:
            return None
        genre = _clean_tag(genre)
        lgenre = genre.lower()
        if lgenre in self.genres:
            ge = self.genres[lgenre]
        else:
            ge = Genre(name=genre)
            self.genres[lgenre] = ge
        return ge
    
    def get_albums_without_cover(self):
        return self.session.query(Album).filter(Album.albumart is None).all()
    
    def fetch_album(self, artist, album, year):
        artistclean = artist.strip().lower()
        if artistclean in self.artists:
            ar = self.artists[artistclean]
        else:
            ar = Artist(name=artist)
            self.artists[artistclean] = ar
            self.session.add(ar)
        self.session.enable_relationship_loading(ar)
        albums = {a.name: a for a in ar.albums}
        if album in albums:
            return albums[album]
        else:
            al = Album(name=album, artist=ar, year=year)
            self.session.add(al)
            return al
    
    def add_track(self, path, name, trackno=None, year=None, duration=0.0, bitrate=None, last_mod_time=None):
        name = _clean_tag(name)
        duration = _clean_tag(duration, mytype='float')
        year = _clean_tag(year, mytype='integer', max_len=4)
        bitrate = _clean_tag(bitrate, allow_none=True)
        if trackno is not None:
            trackno = trackno.split("/")[0]
        trackno = _clean_tag(trackno, mytype='integer')
        
        if path in self.tracks:
            track = self.session.query(Track).filter(Track.path == path).one()
            track.set(name, path, trackno, year, duration, bitrate, last_mod_time)
            self.session.merge(track)
        else:
            track = Track(name, path, trackno, year, duration, bitrate, last_mod_time)
            self.session.add(track)
        
        return track

Base.metadata.create_all(bind=engine)
