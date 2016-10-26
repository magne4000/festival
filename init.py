import logging
import sys

import os

from festivallib.info import Infos
from festivallib.data import Data
from festivallib.model import get_engine, drop_all, create_all

SCHEMA_VERSION = 4

settings_sample_filepath = os.path.join(os.path.dirname(__file__), 'settings.sample.cfg')


def get_config_dict_from_file(filename):
    c = {}
    obj = {}
    with open(filename) as config_file:
        exec(compile(config_file.read(), filename, 'exec'), c)
    for key in c:
        if key.isupper():
            obj[key] = c[key]
    return obj


def check(args=None, unattented=False):
    settings_filepath = args.config or os.path.join(os.path.dirname(__file__), 'settings.cfg')
    if not os.path.isfile(settings_filepath):
        if unattented:
            print("'settings.cfg' file does not exists. First launch festival.py in an interactive"
                  " console for initial configuration.")
            sys.exit(1)
        print("\033[93m'settings.cfg' file does not exists, it will be created.\033[0m")
        print("\033[93mYou just need to fill the following form\033[0m\n")
        sdir = input('\033[1mPath to directory containing musics: \033[0m')
        if os.path.isdir(sdir):
            with open(settings_filepath, 'w') as fw, open(settings_sample_filepath, 'r') as f:
                for line in f:
                    if line.startswith('SCANNER_PATH'):
                        fw.write("SCANNER_PATH = '%s'\n" % sdir)
                    else:
                        fw.write(line)
        else:
            print("Invalid path. Exiting.")
            sys.exit(1)
    else:
        c = get_config_dict_from_file(settings_filepath)
        c_sample = get_config_dict_from_file(settings_sample_filepath)
        config_diff = set(c_sample.keys()) - set(c.keys())
        if len(config_diff) > 0:
            print("\033[93m'settings.cfg' needs a manual update. The following keys from 'settings.sample.cfg'"
                  " need to be added:\033[0m")
            print("\t", "\n\t".join(config_diff), sep='')
            sys.exit(2)
        schema_version = Infos.get('schema_version')
        engine = get_engine(c)
        if engine.has_table('artist') and (schema_version is None or schema_version != SCHEMA_VERSION):
            print("\033[93mModel changed since last update. Database and data will be erased.\033[0m")
            drop_all(c)
            print("\033[93mDatabase DROP OK.\033[0m")
            Data.clear()
            print("\033[93mData CLEAR OK.\033[0m")
            create_all(c)
            print("\033[93mDatabase CREATION OK.\033[0m")
        Infos.update(schema_version=SCHEMA_VERSION)


def init(args):
    from app import get_app
    app = get_app(args)
    logging_level = logging.DEBUG if app.config['DEBUG'] else logging.INFO
    logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging_level)
    from routes import routes
    if app.config['SHOW_DOWNLOAD_BUTTONS']:
        from routes import routesdownload
    from api.subsonic import subsonic
    app.register_blueprint(routes)
    app.register_blueprint(subsonic)
    return app
