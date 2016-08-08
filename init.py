import os
import sys
import logging
from festivallib.info import Infos
from festivallib.data import Data

SCHEMA_VERSION = 2

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
        if schema_version is not None and schema_version != SCHEMA_VERSION:
            print("\033[93mModel changed since last update. Database and covers will be deleted.\033[0m")
            if unattented or not args.yes:
                resp = input('Continue ? [y/N] ')
            else:
                resp = 'y'
            if resp.lower() == 'y':
                Data.clear()
                Infos.update(schema_version=SCHEMA_VERSION)
            else:
                print("\033[93mArborting.\033[0m")
                sys.exit(3)


def init(args):
    from app import get_app
    app = get_app(args)
    logging_level = logging.DEBUG if app.config['DEBUG'] else logging.INFO
    logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging_level)
    from routes import routes
    from api.subsonic import subsonic
    app.register_blueprint(routes)
    app.register_blueprint(subsonic)
    return app
