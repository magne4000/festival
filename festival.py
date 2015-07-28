#!/usr/bin/env python3

from flask import render_template, request, json, send_file, send_from_directory, abort
from flask.json import jsonify
from lib.model import Artist, Album, Track
from lib.request import listartists, listalbumsbyartists, listtracks, listtracksbyalbumsbyartists, gettrack, getalbum, search
from lib.thumbs import Thumb
from app import app
from scanner import Scanner
import json
import os

@app.route("/")
def hello():
    return render_template('index.html')

@app.route("/music/<sid>")
def music(sid):
    tr = gettrack(sid)
    if tr is None or tr.path is None:
        abort(404)
    else:
        return send_file(tr.path, conditional=True)

@app.route("/download/<artist>")
def downloada(sartist):
    pass

@app.route("/download/<artist>/<album>")
def downloadaa(sartist, salbum):
    pass

@app.route("/ajax/list/tracks")
def tracks():
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
    if flat:
        return jsonify(data=[x._asdict() for x in listtracks(ffilter=ffilter, skip=skip, limit=limit)])
    else:
        return jsonify(data=[x._asdict(albums=True, tracks=True) for x in listtracksbyalbumsbyartists(ffilter=ffilter, skip=skip, limit=limit)])

@app.route("/ajax/list/albums")
def albums():
    pass

@app.route("/ajax/list/artists")
def artists():
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

@app.route("/albumart/<album>")
def albumart(album):
    al = getalbum(album)
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
