#!/usr/bin/env python3

import json
import logging
import urllib.parse

import urllib3
from flask import current_app

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
        try:
            import certifi
            self.conn = urllib3.PoolManager(5, timeout=10., cert_reqs='CERT_REQUIRED', ca_certs=certifi.where())
        except ImportError:
            self.conn = urllib3.PoolManager(5, timeout=10.)

    @staticmethod
    def _mbid(jsonobj):
        try:
            return jsonobj['album']['mbid']
        except KeyError:
            return None

    @staticmethod
    def _large(jsonobj):
        try:
            for elt in jsonobj['album']['image']:
                if elt['size'] == 'large' and elt['#text'] != '':
                    return elt['#text']
        except KeyError:
            return None

    def search(self, artist, album):
        self.params['artist'] = artist
        self.params['album'] = album
        params = urllib.parse.urlencode(self.params)
        url = CoverURL.SEARCH_URL + params
        try:
            r = self.conn.request('GET', url)
            ojson = json.loads(r.data.decode('utf-8'))
            return self._mbid(ojson), self._large(ojson)
        except:
            logger.exception('Error while searching album cover')
            return None, None

    def download(self, url, callback):
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
    cu = CoverURL(current_app.config['LASTFM_API_KEY'])
    print(cu.search('Dagoba', 'Tales of the Black Dawn'))
