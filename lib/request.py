from lib.model import session_scope, Track, Album, Artist
from sqlalchemy.orm import joinedload

def escapelike(subject):
    return subject.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')

def getalbum(album_id):
    with session_scope() as session:
        obj = session.query(Album).get(album_id)
        session.expunge_all()
        return obj

def listartists(ffilter=None, skip=0, limit=20):
    with session_scope() as session:
        query = session.query(Artist)
        if ffilter is not None:
            query = ffilter(query)
        query = query.order_by(Artist.name).slice(skip, limit)
        qall = query.all()
        session.expunge_all()
        return qall

def listalbums(ffilter=None, skip=0, limit=20):
    with session_scope() as session:
        query = session.query(Album).join(Album.artist).options(joinedload(Album.artist, innerjoin=True))
        if ffilter is not None:
            query = ffilter(query)
        query = query.order_by(Artist.name, Album.year).slice(skip, limit)
        qall = query.all()
        session.expunge_all()
        return qall

def listalbumsbyartists(ffilter=None, skip=0, limit=20):
    with session_scope() as session:
        query = session.query(Artist).join(Artist.albums).options(joinedload(Artist.albums, innerjoin=True))
        if ffilter is not None:
            query = ffilter(query)
        query = query.order_by(Artist.name, Album.year).slice(skip, limit)
        qall = query.all()
        session.expunge_all()
        return qall

if __name__ == "__main__":
    """
    print(listartists())
    print(listartists(skip=10, limit=20))
    print(listartists(lambda query: query.filter(Artist.name.contains(escapelike('shall')))))
    
    print(listalbums())
    print(listalbums(skip=10, limit=20))
    print(listalbums(lambda query: query.filter(Album.name.contains(escapelike('break')))))
    """
    aba = listalbumsbyartists()
    print(aba)
    for artist in aba:
        print(artist.albums)
    