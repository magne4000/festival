#!/usr/bin/env python3

from flask import render_template, request, json, send_file, send_from_directory, abort, Response
from flask.json import jsonify
from festivallib.model import Artist, Album, TrackInfo
from festivallib.request import typed_fct
from festivallib.thumbs import Thumb
from app import app
from scanner import Scanner
from libs import zipstream
import json
import zipfile
import sys


def ziptracks(tracks, filename):
    def generator():
        z = zipstream.ZipFile(mode='w', compression=zipfile.ZIP_STORED)
        for track in tracks:
            filename = os.path.basename(track.path)
            z.write(track.path, os.path.join(track.artist_name, track.album_name, filename))
        for chunk in z:
            yield chunk

    response = Response(generator(), mimetype='application/zip')
    response.headers['Content-Disposition'] = 'attachment; filename={}.zip'.format(filename)
    return response


@app.route("/")
def hello():
    return render_template('index.html')


@app.route("/music/<sid>")
@typed_fct
def music(typed, sid):
    tr = typed.gettrack(track_id=sid)
    if tr is None or tr.path is None:
        abort(404)
    else:
        resp = send_file(tr.path, conditional=True, as_attachment=True)
        resp.headers['Accept-Ranges'] = 'bytes'
        return resp


@app.route("/download/artist/<artistid>")
@typed_fct
def downloada(typed, artistid):
    tracks = typed.listtracks(lambda query: query.filter(Artist.id == artistid))
    if len(tracks) > 0:
        return ziptracks(tracks, tracks[0].artist_name)
    abort(404)


@app.route("/download/album/<albumid>")
@typed_fct
def downloadaa(typed, albumid):
    tracks = typed.listtracks(lambda query: query.filter(Album.id == albumid))
    if len(tracks) > 0:
        return ziptracks(tracks, "{} - {}".format(tracks[0].artist_name, tracks[0].album_name))
    abort(404)


@app.route("/ajax/list/tracks")
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
                query = query.filter(Track.album_id == filters['album'])
            return query
    else:
        ffilter = None
    if flat:
        return jsonify(data=[x._asdict() for x in typed.listtracks(ffilter=ffilter, skip=skip, limit=limit)])
    else:
        return jsonify(data=[x._asdict(albums=True, tracks=True) for x in typed.listtracksbyalbumsbyartists(ffilter=ffilter, skip=skip, limit=limit)])


@app.route("/ajax/list/albums")
@typed_fct
def lalbums(typed):
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 50, type=int)
    la = request.args.get('la', type=json.loads)
    if la:
        return jsonify(data=[x._asdict(albums=True, tracks=True) for x in typed.listtracksbyalbumsbyartists(skip=skip, limit=limit, order_by=(Album.last_updated.desc(), TrackInfo.trackno, TrackInfo.name))])
    else:
        return jsonify(data=[x._asdict(albums=True, tracks=True) for x in typed.listtracksbyalbumsbyartists(skip=skip, limit=limit)])


@app.route("/ajax/list/artists")
@typed_fct
def lartists(typed):
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 50, type=int)
    return jsonify(data=[x._asdict() for x in typed.listartists(skip=skip, limit=limit)])


@app.route("/ajax/list/albumsbyartists")
@typed_fct
def albumsbyartists(typed):
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 50, type=int)
    filters = request.args.get('filters', type=json.loads)
    ffilter = None
    if filters is not None and 'artist' in filters:
        ffilter = lambda query: query.filter(Artist.id == filters['artist'])
    return jsonify(data=[x._asdict(albums=True) for x in typed.listalbumsbyartists(ffilter=ffilter, skip=skip, limit=limit)])


@app.route("/ajax/list/search")
@typed_fct
def search_(typed):
    filters = request.args.get('filters', type=json.loads)
    filters['skip'] = request.args.get('skip', 0, type=int)
    filters['limit'] = request.args.get('limit', 100, type=int)
    term = request.args.get('term', None)
    return jsonify(data=[x._asdict(albums=True, tracks=True) for x in typed.search(term, **filters)])


@app.route("/ajax/fileinfo")
def fileinfo():
    pass


@app.route("/albumart/<salbum>")
@typed_fct
def albumart(typed, salbum):
    cover = typed.getcoverbyalbumid(salbum)
    if cover is None or cover.mbid == '0':
        abort(404)
    else:
        return send_from_directory(Thumb.getdir(), os.path.basename(cover.path), conditional=True)

from api import *


def main():
    if 'test' not in sys.argv:
        if '--with-scanner' in sys.argv:
            Scanner(app.config['SCANNER_PATH']).start()
        app.run(host='0.0.0.0', debug=True, use_reloader=False)
    else:
        # 'test' argv is here only to test configuration file for update (handled by app.py)
        pass

if __name__ == "__main__":
    main()
