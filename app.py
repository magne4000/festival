import os
import sys
import re
import logging
from flask import Flask
from festivallib.data import Data
from festivallib.info import Infos
from festivallib.model import SCHEMA_VERSION
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
from datetime import timedelta

settings_filepath = os.path.join(os.path.dirname(__file__), 'settings.cfg')
settings_sample_filepath = os.path.join(os.path.dirname(__file__), 'settings.sample.cfg')


def interval_to_timedelta(interval):
    if isinstance(interval, int):
        interval = "%ds" % interval
    ratios = {
        's': 'seconds',
        'm': 'minutes',
        'h': 'hours',
        'd': 'days',
        'w': 'weeks'
    }
    return timedelta(**{ratios[interval[-1:]]: int(interval[0:-1])})


def get_engine(myapp):
    return create_engine(myapp.config['SQLALCHEMY_DATABASE_URI'], poolclass=NullPool, connect_args={'check_same_thread': False})


def get_config_dict_from_file(filename):
    c = {}
    obj = {}
    with open(filename) as config_file:
        exec(compile(config_file.read(), filename, 'exec'), c)
    for key in c:
        if key.isupper():
            obj[key] = c[key]
    return obj


def shape_config(myapp):
    myapp.config.from_pyfile('settings.cfg')
    myapp.config['SCANNER_MODES'] = ['tags']
    if myapp.config['SCANNER_FOLDER_PATTERNS'] is not None and len(myapp.config['SCANNER_FOLDER_PATTERNS']) > 0:
        myapp.config['SCANNER_MODES'].append('folder')
        for i, pattern in enumerate(myapp.config['SCANNER_FOLDER_PATTERNS']):
            myapp.config['SCANNER_FOLDER_PATTERNS'][i] = re.compile(pattern)
    myapp.config['COVERS_FETCH_ONLINE_INTERVAL'] = interval_to_timedelta(myapp.config['COVERS_FETCH_ONLINE_INTERVAL'])
    myapp.config['SCANNER_REFRESH_INTERVAL'] = interval_to_timedelta(myapp.config['SCANNER_REFRESH_INTERVAL'])
    return myapp


def get_app():
    myapp = Flask(__name__)
    return shape_config(myapp)


def check():
    if not os.path.isfile(settings_filepath):
        print("\033[93m'settings.cfg' file does not exists, it will be created.\033[0m")
        print("\033[93mYou just need to fill the following form\033[0m\n")
        sdir = input('\033[1mPath to directory containing musics: \033[0m')
        if os.path.isdir(sdir):
            with open(settings_filepath, 'w') as fw:
                with open(settings_sample_filepath, 'r') as f:
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
            print("\033[93m'settings.cfg' needs a manual update. The following keys from 'settings.sample.cfg' need to be added:\033[0m")
            print("\t", "\n\t".join(config_diff), sep='')
            sys.exit(2)
        if Infos.get('schema_version') != SCHEMA_VERSION:
            print("\033[93mModel changed since last update. Database and covers will be deleted.\033[0m")
            resp = input('Continue ? [y/N] ')
            if resp.lower() == 'y':
                Data.clear()
                Infos.update(schema_version = SCHEMA_VERSION)
            else:
                print("\033[93mArborting.\033[0m")
                sys.exit(3)


check()
app = get_app()


logging_level = logging.DEBUG if app.config['DEBUG'] else logging.INFO
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging_level)
