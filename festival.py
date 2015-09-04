#!/usr/bin/env python3

from flask import render_template, request, json, send_file, send_from_directory, abort, Response
from flask.json import jsonify
from festivallib.model import Artist, Album, Track
from festivallib.request import listartists, listalbumsbyartists, listtracks, listtracksbyalbumsbyartists, gettrack, getalbum, search
from festivallib.thumbs import Thumb
from app import app
from scanner import Scanner
from libs import zipstream
import json
import zipfile


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
def music(sid):
    tr = gettrack(sid)
    if tr is None or tr.path is None:
        abort(404)
    else:
        resp = send_file(tr.path, conditional=True, as_attachment=True)
        resp.headers['Accept-Ranges'] = 'bytes'
        return resp


@app.route("/download/artist/<artistid>")
def downloada(artistid):
    tracks = listtracks(lambda query: query.filter(Artist.id == artistid))
    if len(tracks) > 0:
        return ziptracks(tracks, tracks[0].artist_name)
    abort(404)


@app.route("/download/album/<albumid>")
def downloadaa(albumid):
    tracks = listtracks(lambda query: query.filter(Album.id == albumid))
    if len(tracks) > 0:
        return ziptracks(tracks, "{} - {}".format(tracks[0].artist_name, tracks[0].album_name))
    abort(404)


@app.route("/ajax/list/tracks")
def ltracks():
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
        return jsonify(data=[x._asdict() for x in listtracks(ffilter=ffilter, skip=skip, limit=limit)])
    else:
        return jsonify(data=[x._asdict(albums=True, tracks=True) for x in listtracksbyalbumsbyartists(ffilter=ffilter, skip=skip, limit=limit)])


@app.route("/ajax/list/albums")
def lalbums():
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 50, type=int)
    la = request.args.get('la', type=json.loads)
    if la:
        return jsonify(data=[x._asdict(albums=True, tracks=True) for x in listtracksbyalbumsbyartists(skip=skip, limit=limit, order_by=(Album.last_updated.desc(), Track.trackno))])
    else:
        return jsonify(data=[x._asdict(albums=True, tracks=True) for x in listtracksbyalbumsbyartists(skip=skip, limit=limit)])


@app.route("/ajax/list/artists")
def lartists():
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 50, type=int)
    return jsonify(data=[x._asdict() for x in listartists(skip=skip, limit=limit+skip)])


@app.route("/ajax/list/albumsbyartists")
def albumsbyartists():
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 50, type=int)
    filters = request.args.get('filters', type=json.loads)
    ffilter = None
    if filters is not None and 'artist' in filters:
        ffilter = lambda query: query.filter(Artist.id == filters['artist'])
    return jsonify(data=[x._asdict(albums=True) for x in listalbumsbyartists(ffilter=ffilter, skip=skip, limit=limit+skip)])


@app.route("/ajax/list/search")
def search_():
    filters = request.args.get('filters', type=json.loads)
    filters['skip'] = request.args.get('skip', 0, type=int)
    filters['limit'] = request.args.get('limit', 100, type=int)
    term = request.args.get('term', None)
    return jsonify(data=[x._asdict(albums=True, tracks=True) for x in search(term, **filters)])


@app.route("/ajax/fileinfo")
def fileinfo():
    pass


@app.route("/albumart/<salbum>")
def albumart(salbum):
    al = getalbum(salbum)
    if al is None or al.albumart is None or al.albumart == '-':
        abort(404)
    else:
        return send_from_directory(Thumb.getdir(), os.path.basename(al.albumart), conditional=True)

from api import *


def main():
    Scanner(app.config['SCANNER_PATH']).start()
    app.run(host='0.0.0.0', debug=True, use_reloader=False)

if __name__ == "__main__":
    main()
