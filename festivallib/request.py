from functools import wraps

from flask import request
from sqlalchemy import or_
from sqlalchemy.orm import joinedload, contains_eager, attributes
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.util import KeyedTuple

from .model import session_scope, Track, TrackInfo, Album, Artist, Cover


def limitoffset(query, skip, limit):
    if skip is not None:
        query = query.offset(skip)
    if limit is not None:
        query = query.limit(limit)
    return query


class Typed:
    types_whitelist = ['tags', 'folder']

    def __init__(self, stype='tags'):
        self.chosen_type = stype
        if self.chosen_type not in Typed.types_whitelist:
            self.chosen_type = Typed.types_whitelist[0]

    def session_scope(self):
        return session_scope(self.chosen_type)

    def getartist(self, artist_id):
        with self.session_scope() as session:
            obj = session.query(Artist).get(artist_id)
            session.expunge_all()
            return obj

    def getalbum(self, album_id=None, ffilter=None):
        with self.session_scope() as session:
            if album_id is not None:
                obj = session.query(Album).get(album_id)
                session.expunge_all()
                return obj
            elif ffilter is not None:
                query = session.query(Album).join(Album.artist).options(contains_eager(Album.artist))
                query = ffilter(query)
                obj = query.one()
                session.expunge_all()
                return obj
        return None

    def getcoverbyalbumid(self, album_id):
        with self.session_scope() as session:
            try:
                obj = session.query(Cover).join(Cover.albums).filter(Album.id == album_id).one()
                session.expunge_all()
                return obj
            except NoResultFound:
                return None

    def gettrackinfo(self, trackinfo_id=None, ffilter=None):
        with self.session_scope() as session:
            if trackinfo_id is not None:
                obj = session.query(TrackInfo).get(trackinfo_id)
                session.expunge_all()
                return obj
            elif ffilter is not None:
                query = session.query(TrackInfo).join(TrackInfo.album).join(Album.artist).options(
                    joinedload(TrackInfo.genre), contains_eager(TrackInfo.artist),
                    contains_eager(TrackInfo.album, Album.artist))
                query = ffilter(query)
                obj = query.one()
                session.expunge_all()
                return obj
        return None

    def gettrack(self, track_id=None, trackinfo_id=None):
        with self.session_scope() as session:
            if track_id is not None:
                obj = session.query(Track).get(track_id)
                session.expunge_all()
                return obj
            elif trackinfo_id is not None:
                try:
                    obj = session.query(Track).join(Track.infos).filter(TrackInfo.id == trackinfo_id).one()
                    session.expunge_all()
                    return obj
                except NoResultFound:
                    pass
        return None

    def gettrackfull(self, track_id):
        with self.session_scope() as session:
            try:
                obj = session.query(TrackInfo).join(TrackInfo.album).join(Album.artist).options(
                    joinedload(TrackInfo.genre),
                    contains_eager(TrackInfo.artist),
                    contains_eager(TrackInfo.album, Album.artist)
                ).filter(TrackInfo.id == track_id).one()
                session.expunge_all()
                return obj
            except NoResultFound:
                return None

    def listartists(self, ffilter=None, skip=None, limit=None):
        with self.session_scope() as session:
            query = session.query(Artist)
            if ffilter is not None:
                query = ffilter(query)
            query = limitoffset(query.order_by(Artist.name), skip, limit)
            qall = query.all()
            session.expunge_all()
            return qall

    def listalbums(self, ffilter=None, skip=None, limit=None, order_by=(Artist.name, Album.year.desc())):
        with self.session_scope() as session:
            query = session.query(Album).join(Album.artist).options(contains_eager(Album.artist))
            if ffilter is not None:
                query = ffilter(query)
            if order_by is not None:
                query = limitoffset(query.order_by(*order_by), skip, limit)
            else:
                query = limitoffset(query, skip, limit)
            qall = query.all()
            session.expunge_all()
            if len(qall) > 0 and isinstance(qall[0], KeyedTuple):
                for i, item in enumerate(qall):
                    qall[i] = item[0]
            return qall

    def listalbumsbyartists(self, ffilter=None, skip=None, limit=None):
        with self.session_scope() as session:
            query = session.query(Artist).join(Artist.albums).options(contains_eager(Artist.albums, Album.artist))
            if ffilter is not None:
                query = ffilter(query)
            query = limitoffset(query.order_by(Artist.name, Album.year.desc()), skip, limit)
            qall = query.all()
            session.expunge_all()
            return qall

    def listtracks(self, ffilter=None, skip=None, limit=None):
        with self.session_scope() as session:
            query = session.query(TrackInfo).join(TrackInfo.album).join(Album.artist).options(
                contains_eager(TrackInfo.artist), contains_eager(TrackInfo.album, Album.artist))
            if ffilter is not None:
                query = ffilter(query)
            query = limitoffset(query.order_by(TrackInfo.trackno), skip, limit)
            qall = query.all()
            session.expunge_all()
            return qall

    def counttracks(self, ffilter=None):
        with self.session_scope() as session:
            query = session.query(TrackInfo)
            if ffilter is not None:
                query = ffilter(query)
            return query.count()

    def countalbums(self, ffilter=None):
        with self.session_scope() as session:
            query = session.query(Album)
            if ffilter is not None:
                query = ffilter(query)
            return query.count()

    def listtracksbyalbums(self, ffilter=None, skip=None, limit=None):
        with self.session_scope() as session:
            query = session.query(Album).join(Album.tracks).outerjoin(TrackInfo.genre).options(
                contains_eager(Album.tracks, TrackInfo.album, Album.artist), joinedload(Album.tracks, TrackInfo.genre))
            if ffilter is not None:
                query = ffilter(query)
            query = limitoffset(query.order_by(Album.year.desc(), TrackInfo.trackno), skip, limit)
            qall = query.all()
            # Force artist population
            for x in qall:
                for y in x.tracks:
                    attributes.set_committed_value(y, 'album', x)
                    attributes.set_committed_value(y, 'artist', x.artist)
            session.expunge_all()
            return qall

    def listtracksbyalbumsbyartists(self, ffilter=None, skip=None, limit=None,
                                    order_by=(Artist.name, Album.year.desc(), TrackInfo.trackno, TrackInfo.name)):
        with self.session_scope() as session:
            query = session.query(Artist).join(Artist.albums).join(Album.tracks).join(TrackInfo.track).options(
                contains_eager(Artist.albums, Album.tracks))
            if ffilter is not None:
                query = ffilter(query)
            query = limitoffset(query.order_by(*order_by), skip, limit)
            qall = query.all()
            # Force artist population
            for x in qall:
                for y in x.albums:
                    attributes.set_committed_value(y, 'artist', x)
                    for z in y.tracks:
                        attributes.set_committed_value(z, 'album', y)
                        attributes.set_committed_value(z, 'artist', x)
            session.expunge_all()
            return qall

    def searchartists(self, term, skip=None, limit=None):
        ffilter = lambda query: query.filter(Artist.name.contains(term))
        return self.listartists(ffilter, skip, limit)

    def searchalbums(self, term, skip=None, limit=None):
        ffilter = lambda query: query.filter(Album.name.contains(term))
        return self.listalbums(ffilter, skip, limit)

    def search(self, term, artists=True, albums=True, tracks=True, skip=None, limit=None):
        def ffilter(query):
            filters = []
            if artists:
                filters.append(Artist.name.contains(term))
            if albums:
                filters.append(Album.name.contains(term))
            if tracks:
                filters.append(TrackInfo.name.contains(term))
            if len(filters) > 0:
                query = query.filter(or_(*filters))
            return query

        return self.listtracksbyalbumsbyartists(ffilter, skip, limit)


def typed_fct(func):
    @wraps(func)
    def wrapper(*arg, **kwargs):
        stype = request.args.get('type', 'tags')
        return func(Typed(stype), *arg, **kwargs)

    return wrapper
