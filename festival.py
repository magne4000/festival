#!/usr/bin/env python3

from flask import Flask, render_template
app = Flask(__name__)

from yourapplication.database import db_session

@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()

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
    pass

@app.route("/ajax/list/albumsbyartists")
def albumsbyartists():
    pass

@app.route("/ajax/list/search")
def search():
    pass

@app.route("/ajax/fileinfo")
def fileinfo():
    pass

@app.route("/albumart")
def albumart():
    pass

def main():
    app.config.from_pyfile('settings.cfg')
    app.run(host='0.0.0.0', debug=True)

if __name__ == "__main__":
    main()