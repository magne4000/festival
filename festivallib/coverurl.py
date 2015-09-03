#!/usr/bin/env python3

import urllib.parse
import urllib3
import json
import logging
from app import app

logger = logging.getLogger('coverurl')


class CoverURL:
    SEARCH_URL = "https://ws.audioscrobbler.com/2.0/?"

    def __init__(self, api_key):
        self.params = {
            'format': 'json',
            'method': 'album.getInfo',
            'api_key': api_key,
            'artist': '',
            'album': ''
        }
        self.conn = urllib3.PoolManager(5)

    @staticmethod
    def _large(jsonobj):
        if 'album' in jsonobj and 'image' in jsonobj['album']:
            for elt in jsonobj['album']['image']:
                if elt['size'] == 'large':
                    return elt['#text'] if '#text' in elt and elt['#text'] != '' else None
        return None

    def search(self, artist, album):
        self.params['artist'] = artist
        self.params['album'] = album
        params = urllib.parse.urlencode(self.params)
        url = CoverURL.SEARCH_URL + params
        try:
            r = self.conn.request('GET', url)
            return self._large(json.loads(r.data.decode('utf-8')))
        except:
            logger.exception('Error while searching album cover')
            return None

    def download(self, artist, album, callback):
        url = self.search(artist, album)
        if url is not None:
            try:
                r = self.conn.request('GET', url)
                return callback(r)
            except:
                logger.exception('Error while fetching album cover')
                return callback(None)
        else:
            return callback(None)


if __name__ == "__main__":
    cu = CoverURL(app.config['LASTFM_API_KEY'])
    print(cu.search('Dagoba', 'Tales of the Black Dawn'))
