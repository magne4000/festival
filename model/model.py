import os
import logging
import re
from datetime import datetime
from flask import Flask
from sqlalchemy.orm import relationship, backref, sessionmaker, scoped_session, subqueryload_all
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, create_engine, distinct
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.pool import NullPool
from threading import Lock
from contextlib import contextmanager

app = Flask(__name__)
app.config.from_pyfile('../settings.cfg')
engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'], poolclass=NullPool, connect_args={'check_same_thread':False})

Base = declarative_base()

Session = scoped_session(sessionmaker(bind=engine, expire_on_commit=False))

wlock = Lock()

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

class Artist(Base):
    __tablename__ = "artist"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(254), nullable=False, unique=True)
    albums = relationship("Album", backref="artist")
    
    def __init__(self, name):
        self.name = name
    
    def __repr__(self):
        return "<Artist %r>" % self.name

class Album(Base):
    __tablename__ = "album"
    
    id = Column(Integer, primary_key=True)
    artist_id = Column(Integer, ForeignKey("artist.id"), nullable=False)
    name = Column(String(254), nullable=False)
    albumart = Column(String(254), nullable=True)
    tracks = relationship("Track", backref="album")
    
    def __init__(self, name, artist_id, albumart=None):
        self.name = name
        self.artist_id = artist_id
        self.albumart = albumart
    
    def __repr__(self):
        return "<Album %r.%r>" % (self.artist_id, self.name)

class Genre(Base):
    __tablename__ = "genre"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(254), nullable=False, unique=True)
    
    def __init__(self, name):
        self.name = name
    
    def __repr__(self):
        return "<Genre %r>" % self.name

class Track(Base):
    __tablename__ = "track"
    
    id = Column(Integer, primary_key=True)
    path = Column(Text(500), nullable=False)
    genre_id = Column(Integer, ForeignKey("genre.id"))
    album_id = Column(Integer, ForeignKey("album.id"))
    name = Column(String(254), nullable=False)
    duration = Column(Float, nullable=True)
    year = Column(Integer, nullable=True)
    bitrate = Column(String(10), nullable=True)
    frequency = Column(String(10), nullable=True)
    trackno = Column(Integer, nullable=True)
    last_updated = Column(DateTime)
    
    def __init__(self, name, path, genre_id, album_id, duration=0, year=0, bitrate='', frequency='', trackno='', last_updated=''):
        self.name = name
        self.path = path
        self.album_id = album_id
        self.genre_id = genre_id
        self.duration = duration
        self.year = year
        self.bitrate = bitrate
        self.frequency = frequency
        self.trackno = trackno
        self.last_updated = last_updated
    
    def set(self, name=None, path=None, genre_id=None, album_id=None, trackno=None, year=None, duration=None, bitrate=None, frequency=None, last_updated=None):
        if name is not None:
            self.name = name
        if path is not None:
            self.path = path
        if album_id is not None:
            self.album_id = album_id
        if genre_id is not None:
            self.genre_id = genre_id
        if duration is not None:
            self.duration = duration
        if year is not None:
            self.year = year
        if bitrate is not None:
            self.bitrate = bitrate
        if frequency is not None:
            self.frequency = frequency
        if trackno is not None:
            self.trackno = trackno
        if last_updated is not None:
            self.last_updated = last_updated
        else:
            self.last_updated = datetime.now()
    
    def __repr__(self):
        return "<Track %r>" % self.path

"""


def initialize_store(self):
    create_all()
"""
def _clean_tag(tag, allow_none=False, mytype='string', default=None, max_len=254):
    if default is None and allow_none is False:
        if mytype == 'string':
            default = 'unknown'
        elif mytype == 'integer':
            default = 0
        elif mytype == 'float':
            default = 0.0
    if tag is None or tag == 'None':
        if allow_none is False:
            return default
        else:
            return None
    try:
        tag = str(tag).strip()
    except UnicodeDecodeError:
        tag = tag.strip()
    if tag == '':
        return default
    if mytype == 'integer' and re.match('\d{1,32}', tag) is None:
        return default
    if mytype == 'float':
        try:
            return float(tag)
        except ValueError:
            return default
    return tag[:max_len].strip()

def update_albumart(album, path):
    with session_scope() as session:
        if path is not None:
            album.albumart = path
        else:
            album.albumart = ''
        with wlock:
            session.merge(album)
            session.commit()

def delete_orphans(self):
    with session_scope() as session:
        session.query(Genre).filter(~Genre.id.in_(session.query(distinct(Track.genre_id)))).delete(False)
        session.query(Album).filter(~Album.id.in_(session.query(distinct(Track.album_id)))).delete(False)
        session.query(Artist).filter(~Artist.id.in_(session.query(distinct(Album.artist_id)))).delete(False)
        session.commit()

def delete_tracks(self, tracks):
    with session_scope() as session:
        for track in tracks:
            session.delete(track)
        session.commit()

def add_track(name, path, artist, genre, album, trackno=None, year=None, duration=0.0, bitrate=None, frequency=None, last_mod_time=None, albumart=None):
    name = _clean_tag(name)
    artist = _clean_tag(artist)
    genre = _clean_tag(genre)
    album = _clean_tag(album)
    duration = _clean_tag(duration, mytype='float')
    year = _clean_tag(year, mytype='integer', max_len=4)
    bitrate = _clean_tag(bitrate, allow_none=True)
    frequency = _clean_tag(frequency, allow_none=True)
    trackno = _clean_tag(trackno, mytype='integer')
    with session_scope() as session:
        try:
            oartist = session.query(Artist).filter_by(name=artist).one()
            artist_id = oartist.id
        except NoResultFound:
            new_artist = Artist(artist)
            with wlock:
                session.add(new_artist)
                session.commit()
            artist_id = new_artist.id
    
        try:
            oalbum = session.query(Album).filter_by(name=album).filter_by(artist_id=artist_id).one()
            album_id = oalbum.id
        except NoResultFound:
            new_album = Album(album, artist_id, albumart)
            with wlock:
                session.add(new_album)
                session.commit()
            album_id = new_album.id
    
        try:
            ogenre = session.query(Genre).filter_by(name=genre).one()
            genre_id = ogenre.id
        except NoResultFound:
            new_genre = Genre(genre)
            with wlock:
                session.add(new_genre)
                session.commit()
            genre_id = new_genre.id
        
        try :
            track = session.query(Track).options(subqueryload_all(Track.album, Album.artist)).filter(Track.path == path).one()
            track.set(name, path, genre_id, album_id, trackno, year, duration, bitrate, frequency, last_mod_time)
            with wlock:
                session.merge(track)
                session.commit()
        except NoResultFound:
            track = Track(name, path, genre_id, album_id, trackno, year, duration, bitrate, frequency, last_mod_time)
            with wlock:
                session.add(track)
                session.commit()
            _ = track.album.artist # load
        
    return track

Base.metadata.create_all(bind=engine)