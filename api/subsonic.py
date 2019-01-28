import os
import random
import re
from datetime import datetime

from flask import request, send_file, send_from_directory
from sqlalchemy import func, desc

from festivallib.model import Artist, Album, TrackInfo
from festivallib.request import typed_fct, Typed
from festivallib.thumbs import Thumb
from . import subsonic_routes as subsonic


def get_filter(fromYear=None, toYear=None, genre=None):
    if fromYear is not None:
        yield TrackInfo.year >= fromYear
    if toYear is not None:
        yield TrackInfo.year <= toYear
    if genre is not None:
        yield TrackInfo.genre == genre


def get_filter_by_type(atype, fromYear=None, toYear=None, genre=None):
    if atype == 'newest':
        return lambda query: query.add_columns(func.max(Album.last_updated.label('last_updated'))).group_by(Album.id)
    elif atype == 'starred':
        return lambda query: query.filter(False)
    elif atype == 'byYear':
        return lambda query: query.filter(Album.year.between(fromYear, toYear))
    elif atype == 'genre':
        return lambda query: query.filter(TrackInfo.genre_id == genre)
    return None


def get_sort_by_type(atype):
    if atype == 'newest':
        return desc('last_updated'),
    elif atype == 'highest':
        return None
    elif atype == 'frequent':
        return None
    elif atype == 'recent':
        return None
    elif atype == 'alphabeticalByName':
        return Album.name,
    elif atype == 'alphabeticalByArtist':
        return Artist.name, Album.name
    return Artist.name, Album.year.desc()


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


def format_artist(artist):
    info = {
        'id': format_artist_id(artist.id),
        'name': artist.name,
        'albumCount': artist.album_count()
    }
    return info


def format_album(album, child=False):
    if not isinstance(album, Album):
        album = album[0]
    info = {
        'id': format_album_id(album.id),
        'name': album.name,
        'artist': album.artist.name,
        'artistId': format_artist_id(album.artist_id),
        'songCount': album.track_count(),
        'duration': int(album.duration()),
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
    albumid = format_album_id(track.album_id)
    info = {
        "id": format_track_id(track.track_id),
        "parent": albumid,
        "title": track.name,
        "isDir": False,
        "isVideo": False,
        "type": 'music',
        "albumId": albumid,
        "album": track.album.name,
        "artistId": format_artist_id(track.artist_id),
        "artist": track.artist.name,
        "covertArt": albumid,
        "duration": int(track.track.duration),
        "track": track.trackno,
        "year": track.year,
        "size": track.track.size,
        "contentType": track.track.mimetype
    }
    if 'genre' in track.__dict__ and track.genre:
        info['genre'] = track.genre.name
    if track.track.bitrate:
        info['bitRate'] = int(float(track.track.bitrate) / 1000.0)
    return info


@subsonic.route('/rest/ping.view', methods=['GET', 'POST'])
def ping():
    return request.formatter({})


@subsonic.route('/rest/getLicense.view', methods=['GET', 'POST'])
def show_license():
    return request.formatter({'license': {'valid': True}})


@subsonic.route('/rest/validateLicense.view')
def validate_licence():
    return True


@subsonic.route('/rest/getMusicFolders.view', methods=['GET', 'POST'])
def music_folders():
    return request.formatter({
        'musicFolders': {
            'musicFolder': [{
                'id': 1,
                'name': 'Music'
            }]
        }
    })


@subsonic.route('/rest/getArtists.view', methods=['GET', 'POST'])
@subsonic.route('/rest/getIndexes.view', methods=['GET', 'POST'])
@typed_fct
def indexes(typed):
    """
    Parameters
    * ifModifiedSince : Not taken into account
    * musicFolderId : Not taken into account
    """
    last_modif = int(datetime.now().timestamp() * 1000)
    indexes = {}
    artists = typed.listartists()

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
            'ignoredArticles': '',
            'index': [{
                'name': k,
                'artist': [{
                    'id': format_artist_id(a.id),
                    'name': a.name
                } for a in v]
            } for k, v in sorted(indexes.items())],
        }
    })


@subsonic.route('/rest/getMusicDirectory.view', methods=['GET', 'POST'])
def music_directory():
    typed = Typed('folder')
    eid = request.args.get('id')
    cid = clean_id(eid)
    if is_artist_id(eid):
        dirlist = typed.listalbumsbyartists(lambda query: query.filter(Artist.id == cid))
        children = dirlist[0].albums
        format_directory_id = format_artist_id
        format_child = format_album
    elif is_album_id(eid):
        dirlist = typed.listtracksbyalbums(lambda query: query.filter(Album.id == cid))
        children = dirlist[0].tracks
        format_directory_id = format_album_id
        format_child = format_track
    else:
        return request.error_formatter(10, 'Missing or invalid id')

    return request.formatter({'directory': {
        'id': format_directory_id(dirlist[0].id),
        'name': dirlist[0].name,
        'child': [format_child(child, child=True) for child in children]
    }})


@subsonic.route('/rest/getArtist.view', methods=['GET', 'POST'])
@typed_fct
def artist(typed):
    eid = request.args.get('id')
    cid = clean_id(eid)
    if not is_artist_id(eid):
        return request.error_formatter(10, 'Missing or invalid Artist id')

    ar = typed.listalbumsbyartists(lambda query: query.filter(Artist.id == cid))

    if len(ar) == 0:
        return request.error_formatter(70, 'Artist not found'), 404

    return request.formatter({'artist': {
        'id': format_artist_id(cid),
        'name': ar[0].name,
        'albumCount': ar[0].album_count(),
        'album': [format_album(album) for album in ar[0].albums]
    }})


@subsonic.route('/rest/getAlbum.view', methods=['GET', 'POST'])
def album():
    typed = Typed('tags')
    eid = request.args.get('id')
    cid = clean_id(eid)
    if not is_album_id(eid):
        return request.error_formatter(10, 'Missing or invalid Album id')

    al = typed.listtracksbyalbums(lambda query: query.filter(Album.id == cid))

    if len(al) == 0:
        return request.error_formatter(70, 'Album not found'), 404

    return request.formatter({'album': {
        'id': format_album_id(cid),
        'name': al[0].name,
        'albumCount': al[0].track_count(),
        'song': [format_track(track) for track in al[0].tracks]
    }})


@subsonic.route('/rest/getSong.view', methods=['GET', 'POST'])
@typed_fct
def song(typed):
    eid = request.args.get('id')
    cid = clean_id(eid)
    if not is_track_id(eid):
        return request.error_formatter(10, 'Missing or invalid Song id')

    tr = typed.gettrackfull(cid)

    if not tr:
        return request.error_formatter(70, 'Song not found'), 404

    return request.formatter({'song': format_track(tr)})


def check_parameter(request, key, allow_none=True, choices=None, fct=None):
    val = request.args.get(key)
    if val is None and not allow_none:
        return False, request.error_formatter(10, 'Missing parameter %s' % key)
    if choices is not None and val not in choices:
        return False, request.error_formatter(0, 'Invalid value %s for parameter %s' % (val, key))
    if fct is not None:
        try:
            return True, fct(val)
        except:
            return False, request.error_formatter(0, 'Invalid parameter %s' % key)
    return True, val


def _album_list(typed):
    ok, atype = check_parameter(request, 'type', allow_none=False,
                                choices=['random', 'newest', 'highest', 'frequent', 'recent', 'starred',
                                         'alphabeticalByName', 'alphabeticalByArtist', 'byYear', 'genre'])
    if not ok:
        return False, atype
    ok, size = check_parameter(request, 'size', fct=lambda val: int(val) if val else 10)
    if not ok:
        return False, size
    ok, offset = check_parameter(request, 'offset', fct=lambda val: int(val) if val else 0)
    if not ok:
        return False, offset
    fromYear = request.args.get('fromYear')
    toYear = request.args.get('toYear')
    genre = request.args.get('genre')

    if atype == "byYear" and (not fromYear or not toYear):
        return False, request.error_formatter(10, 'Missing parameter fromYear or toYear')
    elif atype == "genre" and not genre:
        return False, request.error_formatter(10, 'Missing parameter genre')

    if atype == "random":
        count = typed.countalbums()

        def gen():
            for _ in range(size):
                x = random.choice(range(count))
                yield typed.getalbum(ffilter=lambda query: query.offset(x).limit(1))

        return True, gen()
    else:
        fltr = get_filter_by_type(atype, fromYear=fromYear, toYear=toYear, genre=genre)
        srt = get_sort_by_type(atype)
        return True, typed.listalbums(fltr, skip=offset, limit=size, order_by=srt)


@subsonic.route('/rest/getRandomSongs.view', methods=['GET', 'POST'])
@typed_fct
def random_songs(typed):
    ok, size = check_parameter(request, 'size', fct=lambda val: int(val) if val else 10)
    if not ok:
        return False, size
    size = min(size, 50)
    fromYear = request.args.get('fromYear')
    toYear = request.args.get('toYear')
    genre = request.args.get('genre')

    fltr = list(get_filter(fromYear=fromYear, toYear=toYear, genre=genre))
    count = typed.counttracks(lambda query: query.filter(*fltr))

    def gen():
        if count > 0:
            for _ in range(size):
                x = random.choice(range(count))
                yield typed.gettrackinfo(ffilter=lambda query: query.filter(*fltr).offset(x).limit(1))

    return request.formatter({'randomSongs': {
        'song': [format_track(track, child=True) for track in gen()]
    }})


@subsonic.route('/rest/getAlbumList.view', methods=['GET', 'POST'])
@typed_fct
def album_list(typed):
    ok, albums = _album_list(typed)
    if not ok:
        return albums

    return request.formatter({'albumList': {
        'album': [format_album(album, child=True) for album in albums]
    }})


@subsonic.route('/rest/getAlbumList2.view', methods=['GET', 'POST'])
@typed_fct
def album_list2(typed):
    ok, albums = _album_list(typed)
    if not ok:
        return albums

    return request.formatter({'albumList2': {
        'album': [format_album(album) for album in albums]
    }})


@subsonic.route('/rest/search2.view', methods=['GET', 'POST'])
@subsonic.route('/rest/search3.view', methods=['GET', 'POST'])
@typed_fct
def search2and3(typed):
    q = request.args.get('query')
    if not q:
        return request.error_formatter(10, 'Missing query parameter')
    ok, artistCount = check_parameter(request, 'artistCount', fct=lambda val: int(val) if val else 20)
    if not ok:
        return False, artistCount
    ok, artistOffset = check_parameter(request, 'artistOffset', fct=lambda val: int(val) if val else 0)
    if not ok:
        return False, artistOffset
    ok, albumCount = check_parameter(request, 'albumCount', fct=lambda val: int(val) if val else 20)
    if not ok:
        return False, albumCount
    ok, albumOffset = check_parameter(request, 'albumOffset', fct=lambda val: int(val) if val else 0)
    if not ok:
        return False, albumOffset
    ok, songCount = check_parameter(request, 'songCount', fct=lambda val: int(val) if val else 20)
    if not ok:
        return False, songCount
    ok, songOffset = check_parameter(request, 'songOffset', fct=lambda val: int(val) if val else 0)
    if not ok:
        return False, songOffset

    artists = typed.listartists(lambda query: query.filter(Artist.name.contains(q)), skip=artistOffset, limit=artistCount)
    albums = typed.listalbums(lambda query: query.filter(Album.name.contains(q)), skip=albumOffset, limit=albumCount)
    tracks = typed.listtracks(lambda query: query.filter(TrackInfo.name.contains(q)), skip=songOffset, limit=songCount)

    return request.formatter({'searchResult2': {
        'artist': [format_artist(artist) for artist in artists],
        'album': [format_album(album) for album in albums],
        'track': [format_track(track) for track in tracks]
    }})


@subsonic.route('/rest/getCoverArt.view', methods=['GET', 'POST'])
@typed_fct
def cover_art(typed):
    eid = request.args.get('id')
    cid = clean_id(eid)
    if not is_track_id(eid) and not is_album_id(eid):
        return request.error_formatter(10, 'Invalid id')

    if is_track_id(eid):
        tr = typed.gettrackinfo(cid)
        if tr is None or tr.album_id is None:
            return request.error_formatter(70, 'Cover art not found'), 404
        else:
            cid = tr.album_id
    cover = typed.getcoverbyalbumid(cid)
    if cover is None or cover.mbid == '0':
        return request.error_formatter(70, 'Cover art not found'), 404
    else:
        return send_from_directory(Thumb.getdir(), os.path.basename(cover.path), conditional=True)


@subsonic.route('/rest/download.view', methods=['GET', 'POST'])
@subsonic.route('/rest/stream.view', methods=['GET', 'POST'])
@typed_fct
def download(typed):
    eid = request.args.get('id')
    cid = clean_id(eid)
    if not is_track_id(eid):
        return request.error_formatter(10, 'Invalid id')

    tr = typed.gettrack(cid)

    if tr is None or tr.path is None:
        return request.error_formatter(70, 'Track not found'), 404
    else:
        return send_file(tr.path, conditional=True)
