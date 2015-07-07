#!/usr/bin/env python3

from flask import Flask, render_template, request, json, send_file, abort
from flask.json import jsonify
from lib.model import Artist
from lib.request import listartists, listalbumsbyartists, getalbum
import json
app = Flask(__name__)

@app.route("/")
def hello():
    return render_template('index.html')

@app.route("/music/<id>")
def music(sid):
    pass

@app.route("/download/<artist>")
def downloada(sartist):
    pass

@app.route("/download/<artist>/<album>")
def downloadaa(sartist, salbum):
    pass

@app.route("/ajax/list/tracks")
def tracks():
    pass

@app.route("/ajax/list/albums")
def albums():
    pass

@app.route("/ajax/list/artists")
def artists():
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 50, type=int)
    return jsonify(data=[x.as_dict() for x in listartists(skip=skip, limit=limit+skip)])

@app.route("/ajax/list/albumsbyartists")
def albumsbyartists():
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 50, type=int)
    filters = request.args.get('filters', type=json.loads)
    ffilter = None
    if filters is not None and 'artist' in filters:
        ffilter = lambda query: query.filter(Artist.id == filters['artist'])
    return jsonify(data=[x.as_dict() for x in listalbumsbyartists(ffilter=ffilter, skip=skip, limit=limit+skip)])

@app.route("/ajax/list/search")
def search():
    pass

@app.route("/ajax/fileinfo")
def fileinfo():
    pass

@app.route("/albumart/<album>")
def albumart(album):
    al = getalbum(album)
    if al.albumart is None:
        abort(404)
    else:
        return send_file(al.albumart)

def main():
    app.config.from_pyfile('settings.cfg')
    app.run(host='0.0.0.0', debug=True)

if __name__ == "__main__":
    main()