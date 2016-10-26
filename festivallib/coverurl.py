#!/usr/bin/env python3

import json
import logging
import urllib.parse

import urllib3

logger = logging.getLogger('coverurl')


class CoverURL:
    SEARCH_URL = "https://ws.audioscrobbler.com/2.0/?"

    def __init__(self, api_key):
        self.params = {
            'format': 'json',
            'api_key': api_key
        }
        try:
            import certifi
            self.conn = urllib3.PoolManager(5, timeout=10., cert_reqs='CERT_REQUIRED', ca_certs=certifi.where())
        except ImportError:
            self.conn = urllib3.PoolManager(5, timeout=10.)

    @staticmethod
    def _mbid(jsonobj, key):
        try:
            return jsonobj[key]['mbid']
        except KeyError:
            return None

    @staticmethod
    def _extralarge_or_large(jsonobj, key):
        large = None
        try:
            for elt in jsonobj[key]['image']:
                if elt['#text'] != '':
                    if elt['size'] == 'extralarge':
                        return elt['#text']
                    elif elt['size'] == 'large':
                        large = elt['#text']
        except KeyError:
            return None
        return large

    def geturl(self, **kwargs):
        params = self.params.copy()
        params.update({key: value for key, value in kwargs.items() if value is not None})
        return CoverURL.SEARCH_URL + urllib.parse.urlencode(params)

    def search(self, artist, album=None):
        if album is None:
            key = 'artist'
        else:
            key = 'album'
        url = self.geturl(method='%s.getInfo' % key, artist=artist, album=album)
        print(url)
        try:
            r = self.conn.request('GET', url)
            ojson = json.loads(r.data.decode('utf-8'))
            return self._mbid(ojson, key), self._extralarge_or_large(ojson, key)
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
    cu = CoverURL('d9ba5638b0b058105af31af8c6a4b252')
    print(cu.search('Dagoba', 'Tales of the Black Dawn'))
    print(cu.search('Dagoba'))
