import json
import mimetypes
import os
import zipfile
from warnings import warn
from zlib import adler32

from flask import Blueprint, jsonify, Response, render_template, json, abort, redirect, url_for, request, send_file, \
    send_from_directory

from festivallib.model import Album, TrackInfo, Artist
from festivallib.request import typed_fct
from festivallib.thumbs import Thumb
from libs import zipstream

routes = Blueprint('routes', __name__, template_folder='templates')


def ziptracks(tracks, filename):
    def generator():
        z = zipstream.ZipFile(mode='w', compression=zipfile.ZIP_STORED)
        for trackinfo in tracks:
            afilename = os.path.basename(trackinfo.track.path)
            z.write(trackinfo.track.path, os.path.join(trackinfo.artist.name, trackinfo.album.name, afilename))
        for chunk in z:
            yield chunk

    response = Response(generator(), mimetype='application/zip')
    response.headers['Content-Disposition'] = 'attachment; filename={}.zip'.format(filename)
    return response


def parse_range_header(value):
    if not value or '=' not in value:
        return None

    ranges = []
    last_end = 0
    units, rng = value.split('=', 1)
    units = units.strip().lower()

    for item in rng.split(','):
        item = item.strip()
        if '-' not in item:
            return None
        if item.startswith('-'):
            if last_end < 0:
                return None
            try:
                begin = int(item)
            except ValueError:
                return None
            end = None
            last_end = -1
        elif '-' in item:
            begin, end = item.split('-', 1)
            begin = begin.strip()
            end = end.strip()
            if not begin.isdigit():
                return None
            begin = int(begin)
            if begin < last_end or last_end < 0:
                return None
            if end:
                if not end.isdigit():
                    return None
                end = int(end) + 1
                if begin >= end:
                    return None
            else:
                end = None
            last_end = end
        ranges.append((begin, end))

    return units, ranges


def send_file_partial(path, **kwargs):
    range_header = request.headers.get('Range', None)
    rv = None
    size = os.path.getsize(path)
    if range_header:
        rh = parse_range_header(range_header)
        if rh is not None and len(rh[1]) == 1:
            start, end = rh[1][0]
            if end is None:
                end = size
            length = end - start
            if length != size:

                def yield_file(chunk=8192):
                    remaining = length
                    with open(path, 'rb') as f:
                        f.seek(start)
                        while remaining > 0:
                            data = f.read(min(chunk, remaining))
                            if len(data) > 0:
                                remaining -= len(data)
                                yield data
                            else:
                                remaining = 0

                rv = Response(
                    yield_file(),
                    206,
                    mimetype=mimetypes.guess_type(path)[0],
                    direct_passthrough=True
                )
                rv.headers.add(
                    'Content-Range',
                    'bytes {0}-{1}/{2}'.format(start, end - 1, size)
                )
                rv.headers['Content-Length'] = length
    if rv is None:
        rv = send_file(path, **kwargs)
    try:
        rv.set_etag('%s-%s-%s' % (
            os.path.getmtime(path),
            size,
            adler32(path.encode('utf-8', 'replace')) & 0xffffffff
        ))
    except OSError:
        warn('Access %s failed, maybe it does not exist, so ignore etags in '
             'headers' % path, stacklevel=2)
    rv = rv.make_conditional(request)
    if rv.status_code == 304:
        rv.headers.pop('x-sendfile', None)
    rv.headers['Accept-Ranges'] = 'bytes'
    attachment_filename = os.path.basename(path)
    rv.headers.add('Content-Disposition', 'attachment',
                   filename=attachment_filename.encode('latin-1', 'replace').decode('latin-1'))
    return rv


@routes.route("/")
def hello():
    return render_template('index.html')


@routes.route("/music/<sid>")
@typed_fct
def music(typed, sid):
    tr = typed.gettrack(track_id=sid)
    if tr is None or tr.path is None:
        abort(404)
    else:
        return send_file_partial(tr.path, conditional=True, add_etags=False)


@routes.route("/download/artist/<artistid>")
@typed_fct
def downloada(typed, artistid):
    tracks = typed.listtracks(lambda query: query.filter(Artist.id == artistid))
    if len(tracks) > 0:
        return ziptracks(tracks, tracks[0].artist.name)
    abort(404)


@routes.route("/download/album/<albumid>")
@typed_fct
def downloadaa(typed, albumid):
    tracks = typed.listtracks(lambda query: query.filter(Album.id == albumid))
    if len(tracks) > 0:
        return ziptracks(tracks, "{} - {}".format(tracks[0].artist.name, tracks[0].album.name))
    abort(404)


@routes.route("/ajax/list/tracks")
@typed_fct
def ltracks(typed):
    skip = request.args.get('skip', None, type=int)
    limit = request.args.get('limit', None, type=int)
    flat = request.args.get('flat', True, type=json.loads)
    filters = request.args.get('filters', type=json.loads)
    if filters is not None:
        def ffilter(query):
            if 'artist' in filters:
                query = query.filter(Album.artist_id == filters['artist'])
            if 'album' in filters:
                query = query.filter(TrackInfo.album_id == filters['album'])
            return query
    else:
        ffilter = None
    if flat:
        return jsonify(data=[x.as_dict() for x in typed.listtracks(ffilter=ffilter, skip=skip, limit=limit)])
    else:
        return jsonify(data=[x.as_dict(albums=True, tracks=True) for x in
                             typed.listtracksbyalbumsbyartists(ffilter=ffilter, skip=skip, limit=limit)])


@routes.route("/ajax/list/albums")
@typed_fct
def lalbums(typed):
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 50, type=int)
    la = request.args.get('la', type=json.loads)
    if la:
        return jsonify(data=[x.as_dict(albums=True, tracks=True) for x in
                             typed.listtracksbyalbumsbyartists(skip=skip, limit=limit, order_by=(
                                 Album.last_updated.desc(), TrackInfo.trackno, TrackInfo.name))])
    else:
        return jsonify(data=[x.as_dict(albums=True, tracks=True) for x in
                             typed.listtracksbyalbumsbyartists(skip=skip, limit=limit)])


@routes.route("/ajax/list/artists")
@typed_fct
def lartists(typed):
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 50, type=int)
    return jsonify(data=[x.as_dict() for x in typed.listartists(skip=skip, limit=limit)])


@routes.route("/ajax/list/albumsbyartists")
@typed_fct
def albumsbyartists(typed):
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 50, type=int)
    filters = request.args.get('filters', type=json.loads)
    ffilter = None
    if filters is not None and 'artist' in filters:
        ffilter = lambda query: query.filter(Artist.id == filters['artist'])
    return jsonify(
        data=[x.as_dict(albums=True) for x in typed.listalbumsbyartists(ffilter=ffilter, skip=skip, limit=limit)])


@routes.route("/ajax/list/search")
@typed_fct
def search_(typed):
    filters = request.args.get('filters', type=json.loads)
    filters['skip'] = request.args.get('skip', 0, type=int)
    filters['limit'] = request.args.get('limit', 100, type=int)
    term = request.args.get('term', None)
    return jsonify(data=[x.as_dict(albums=True, tracks=True) for x in typed.search(term, **filters)])


@routes.route("/ajax/fileinfo")
def fileinfo():
    pass


@routes.route("/albumart/<salbum>")
@typed_fct
def albumart(typed, salbum):
    cover = typed.getcoverbyalbumid(salbum)
    if cover is None or cover.mbid == '0':
        return redirect(url_for('static', filename='images/nocover.png'))
    else:
        return send_from_directory(Thumb.getdir(), os.path.basename(cover.path), conditional=True)
