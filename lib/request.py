from .model import session_scope, Track, Album, Artist, Genre
from sqlalchemy import or_
from sqlalchemy.orm import joinedload, joinedload_all, contains_eager, aliased

def limitoffset(query, skip, limit):
    if skip is not None:
        query = query.offset(skip)
    if limit is not None:
        query = query.limit(limit)
    return query

def getartist(artist_id):
    with session_scope() as session:
        obj = session.query(Artist).get(artist_id)
        session.expunge_all()
        return obj

def getalbum(album_id=None, ffilter=None):
    with session_scope() as session:
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

def gettrack(track_id=None, ffilter=None):
    with session_scope() as session:
        if track_id is not None:
            obj = session.query(Track).get(track_id)
            session.expunge_all()
            return obj
        elif ffilter is not None:
            query = session.query(Track).join(Track.album).join(Album.artist).options(joinedload(Track.genre), contains_eager(Track.album, Album.artist))
            query = ffilter(query)
            obj = query.one()
            session.expunge_all()
            return obj
    return None

def gettrackfull(track_id):
    with session_scope() as session:
        obj = session.query(Track).join(Track.album).join(Album.artist).options(joinedload(Track.genre), contains_eager(Track.album, Album.artist)).filter(Track.id == track_id).one()
        session.expunge_all()
        return obj

def listartists(ffilter=None, skip=None, limit=None):
    with session_scope() as session:
        query = session.query(Artist)
        if ffilter is not None:
            query = ffilter(query)
        query = limitoffset(query.order_by(Artist.name), skip, limit)
        qall = query.all()
        session.expunge_all()
        return qall

def listalbums(ffilter=None, skip=None, limit=None, order_by=(Artist.name, Album.year.desc())):
    with session_scope() as session:
        query = session.query(Album).join(Album.artist).options(contains_eager(Album.artist))
        if ffilter is not None:
            query = ffilter(query)
        if order_by is not None:
            query = limitoffset(query.order_by(*order_by), skip, limit)
        else:
            query = limitoffset(query, skip, limit)
        qall = query.all()
        session.expunge_all()
        return qall

def listalbumsbyartists(ffilter=None, skip=None, limit=None):
    with session_scope() as session:
        query = session.query(Artist).join(Artist.albums).options(contains_eager(Artist.albums, Album.artist))
        if ffilter is not None:
            query = ffilter(query)
        query = limitoffset(query.order_by(Artist.name, Album.year.desc()), skip, limit)
        qall = query.all()
        session.expunge_all()
        return qall

def listtracks(ffilter=None, skip=None, limit=None):
    with session_scope() as session:
        query = session.query(Track).join(Track.album).join(Album.artist).options(contains_eager(Track.album, Album.artist))
        if ffilter is not None:
            query = ffilter(query)
        query = limitoffset(query.order_by(Track.trackno), skip, limit)
        qall = query.all()
        session.expunge_all()
        return qall

def counttracks(ffilter=None):
    with session_scope() as session:
        query = session.query(Track)
        if ffilter is not None:
            query = ffilter(query)
        return query.count()
        
def countalbums(ffilter=None):
    with session_scope() as session:
        query = session.query(Album)
        if ffilter is not None:
            query = ffilter(query)
        return query.count()
        

def listtracksbyalbums(ffilter=None, skip=None, limit=None):
    with session_scope() as session:
        query = session.query(Album).join(Album.tracks).outerjoin(Track.genre).options(contains_eager(Album.tracks, Track.album, Album.artist), joinedload(Album.tracks, Track.genre))
        if ffilter is not None:
            query = ffilter(query)
        query = limitoffset(query.order_by(Album.year.desc(), Track.trackno), skip, limit)
        qall = query.all()
        # Force artist_name population
        for x in qall:
            for y in x.tracks:
                _ = y.album.artist.name
        session.expunge_all()
        return qall

def listtracksbyalbumsbyartists(ffilter=None, skip=None, limit=None):
    with session_scope() as session:
        query = session.query(Artist).join(Artist.albums).join(Album.tracks).options(contains_eager(Artist.albums, Album.tracks, Track.album))
        if ffilter is not None:
            query = ffilter(query)
        query = limitoffset(query.order_by(Artist.name, Album.year.desc(), Track.trackno), skip, limit)
        qall = query.all()
        # Force artist_name population
        for x in qall:
            for y in x.albums:
                for z in y.tracks:
                    _ = z.album.artist.name
        session.expunge_all()
        return qall

def searchartists(term, skip=None, limit=None):
    ffilter = lambda query: query.filter(Artist.name.contains(term))
    return listartists(ffilter, skip, limit)

def searchalbums(term, skip=None, limit=None):
    ffilter = lambda query: query.filter(Album.name.contains(term))
    return listalbums(ffilter, skip, limit)

def search(term, artists=True, albums=True, tracks=True, skip=None, limit=None):
    def ffilter(query):
        filters = []
        if artists:
            filters.append(Artist.name.contains(term))
        if albums:
            filters.append(Album.name.contains(term))
        if tracks:
            filters.append(Track.name.contains(term))
        if len(filters) > 0:
            query = query.filter(or_(*filters))
        return query
    return listtracksbyalbumsbyartists(ffilter, skip, limit)

if __name__ == "__main__":
    """
    print(listartists())
    print(listartists(skip=10, limit=20))
    print(listartists(lambda query: query.filter(Artist.name.contains('shall'))))
    
    print(listalbums())
    print(listalbums(skip=10, limit=20))
    print(listalbums(lambda query: query.filter(Album.name.contains('break'))))
    
    artists = listalbumsbyartists()
    print(artists)
    for artist in artists:
        print(artist.albums)
    
    artists = search('beyond', artists=True, albums=True, tracks=True)
    for artist in artists:
        print(artist)
        if 'albums' in artist.__dict__:
            for album in artist.albums:
                print(album)
                if 'tracks' in album.__dict__:
                    print(album.tracks)
    """
    
    print([x._asdict() for x in listtracks(skip=10, limit=20)])
    