import re
from datetime import datetime
from flask import request
from app import app
from lib.model import session_scope
from lib.request import listartists, listalbumsbyartists, listtracksbyalbums, getartist, Artist, Album

def get_by_id(req, sqlclass, param='id'):
    eid = req.args.get(param)
    if not eid:
        return False, req.error_formatter(10, 'Missing %s id' % sqlclass.__name__)
    
    with session_scope() as session:
        obj = session.query(sqlclass).get(eid)
        if not obj:
            return False, (req.error_formatter(70, '%s not found' % sqlclass.__name__), 404)
    
    return True, obj

def format_track_id(eid):
    return 'TR%s' % eid

def format_artist_id(eid):
    return 'AR%s' % eid

def format_album_id(eid):
    return 'AL%s' % eid

def is_track_id(eid):
    return eid.startswith('TR')

def is_artist_id(eid):
    return eid.startswith('AR')

def is_album_id(eid):
    return eid.startswith('AL')

def clean_id(eid):
    return eid[2:]

def format_album(album, child=False):
    info = {
        'id': format_album_id(album.id),
        'name': album.name,
        'artist': album.artist.name,
        'artistId': format_artist_id(album.artist_id),
        'songCount': album.track_count,
        'duration': album.duration,
        # TODO 'created': min(map(lambda t: t.created, self.tracks)).isoformat(),
        'year': album.year,
        'coverArt': format_album_id(album.id),
        'averageRating': 0
    }
    
    if child:
        info['isDir'] = True
        if album.year:
            info['title'] = "{} ({})".format(album.name, album.year)
        else:
            info['title'] = album.name
        info['parent'] = format_artist_id(album.artist_id)

    return info

def format_track(track, child=False):
    albumId = format_album_id(track.album_id);
    info = {
        "id": format_track_id(track.id),
        "parent": albumId,
        "title": track.name,
        "isDir": False,
        "isVideo": False,
        "type": 'music',
        "albumId": albumId,
        "album": track.album_name,
        "artistId": format_artist_id(track.album.artist_id),
        "artist": track.artist_name,
        "covertArt": albumId,
        "duration": track.duration,
        "bitRate": track.bitrate,
        "track": track.trackno,
        "year": track.year,
        "genre": track.genre_name,
        # TODO "size": fs.statSync(elt.path).size,
        # TODO "suffix": path.extname(elt.path),
        # TODO "contentType": elt.mime,
        "path": '' # TODO ?
    };
    return info

@app.route('/rest/ping.view', methods = [ 'GET', 'POST' ])
def ping():
	return request.formatter({})

@app.route('/rest/getLicense.view', methods = [ 'GET', 'POST' ])
def license():
	return request.formatter({ 'license': { 'valid': True } })

@app.route('/rest/getMusicFolders.view', methods = [ 'GET', 'POST' ])
def music_folders():
    return request.formatter({
        'musicFolders': {
            'musicFolder': [{
                'id': 1,
                'name': 'Music'
            }]
        }
    })

@app.route('/rest/getArtists.view', methods = [ 'GET', 'POST' ])
@app.route('/rest/getIndexes.view', methods = [ 'GET', 'POST' ])
def indexes():
    # musicFolderId = request.args.get('musicFolderId')
    # We have a unique musicFolderId so do not take it into account
    """
    TODO
    
    ifModifiedSince = request.args.get('ifModifiedSince')
    if ifModifiedSince:
        try:
            ifModifiedSince = int(ifModifiedSince) / 1000
        except:
            return request.error_formatter(0, 'Invalid timestamp')
    """
    last_modif = int(datetime.now().timestamp() * 1000)
    indexes = {}
    artists = listartists()
    
    for artist in artists:
        letter = artist.name[0].upper()
        if letter == "X" or letter == "Y" or letter == "Z":
            letter = "X-Z"
        elif re.match("^[A-W]$", letter) is None:
            letter = "#"
        
        if letter not in indexes:
            indexes[letter] = []

        indexes[letter].append(artist)

    return request.formatter({
        'indexes': {
            'lastModified': last_modif,
            'index': [{
                'name': k,
                'artist': [{
                    'id': format_artist_id(a.id),
                    'name': a.name
                } for a in v]
            } for k, v in sorted(indexes.items())],
        }
    })

@app.route('/rest/getMusicDirectory.view', methods = [ 'GET', 'POST' ])
def music_directory():
    eid = request.args.get('id')
    cid = clean_id(eid)
    if is_artist_id(eid):
        dirlist = listalbumsbyartists(lambda query: query.filter(Artist.id == cid))
        children = dirlist[0].albums
        format_directory_id = format_artist_id
        format_child = format_album
    elif is_album_id(eid):
        dirlist = listtracksbyalbums(lambda query: query.filter(Album.id == cid))
        children = dirlist[0].tracks
        format_directory_id = format_album_id
        format_child = format_track
    """
    TODO
    
    else:
    """
    
    return request.formatter({ 'directory': {
        'id': format_directory_id(dirlist[0].id),
        'name': dirlist[0].name,
        'child': [format_child(child, child=True) for child in children]
    }})

@app.route('/rest/getArtist.view', methods = [ 'GET', 'POST' ])
def artist():
    eid = request.args.get('id')
    cid = clean_id(eid)
    if not is_artist_id(eid):
        return request.error_formatter(10, 'Missing or invalid Artist id')
    
    ar = listalbumsbyartists(lambda query: query.filter(Artist.id == cid))
    
    if len(ar) == 0:
        return (request.error_formatter(70, 'Artist not found'), 404)
    
    return request.formatter({ 'artist': {
        'id': format_artist_id(cid),
        'name': ar[0].name,
        'albumCount': ar[0].album_count(),
        'album': [format_album(album) for album in ar[0].albums]
    }})
    