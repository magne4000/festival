#!/usr/bin/env python3

import traceback
import urllib.request
import urllib.parse
import urllib.error
import json
import sys
from flask import Flask
from app import app

class CoverURL:
    SEARCH_URL = "http://ws.audioscrobbler.com/2.0/?"
    
    def __init__(self, api_key):
        self.params = {
            'format': 'json',
            'method': 'album.getInfo',
            'api_key': api_key,
            'artist': '',
            'album': ''
        }
    
    def _large(self, jsonobj):
        if 'album' in jsonobj and 'image' in jsonobj['album']:
            for elt in jsonobj['album']['image']:
                if elt['size'] == 'large':
                    return elt['#text'] if elt['#text'] != '' else None
        return None
    
    def search(self, artist, album):
        self.params['artist'] = artist
        self.params['album'] = album
        params = urllib.parse.urlencode(self.params)
        url = CoverURL.SEARCH_URL + params
        try:
            with urllib.request.urlopen(url) as f:
                return self._large(json.loads(f.read().decode('utf-8')))
        except urllib.error.URLError:
            print(traceback.format_exc(), file=sys.stderr)
            return None
    
    def download(self, artist, album, callback):
        url = self.search(artist, album)
        if url is not None:
            try:
                with urllib.request.urlopen(url) as f:
                    return callback(f)
            except urllib.error.URLError:
                print(traceback.format_exc(), file=sys.stderr)
                return callback(None)
        else:
            return callback(None)

def test():
    cu = CoverURL(app.config['LASTFM_API_KEY'])
    print(cu.search('Dagoba', 'Tales of the Black Dawn'))

if __name__ == "__main__":
    test()