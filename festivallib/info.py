import pickle
import os
from .data import Data


class Infos(Data):

    NAME = 'info'

    @staticmethod
    def update(last_scan=None, last_cover_scan=None, schema_version=None):
        info = Infos.load()
        if info is None:
            info = {
                'last_scan': last_scan,
                'last_cover_scan': last_cover_scan,
                'schema_version': schema_version
            }
        else:
            if last_scan is not None:
                info['last_scan'] = last_scan
            if last_cover_scan is not None:
                info['last_cover_scan'] = last_cover_scan
            if schema_version is not None:
                info['schema_version'] = schema_version
        with open(Infos.getpath(), 'wb') as f:
            pickle.dump(info, f, pickle.HIGHEST_PROTOCOL)

    @staticmethod
    def load():
        fpath = Infos.getpath()
        if os.path.isfile(fpath):
            with open(fpath, 'rb') as f:
                return pickle.load(f)
        return None

    @staticmethod
    def get(key):
        info = Infos.load()
        if info is not None:
            return Infos.load()[key]
        return None

    @staticmethod
    def getpath():
        return os.path.join(Data.DIR, Infos.NAME)
