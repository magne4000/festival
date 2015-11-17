import os
import sys
import re

settings_filepath = os.path.join(os.path.dirname(__file__), 'settings.cfg')
settings_sample_filepath = os.path.join(os.path.dirname(__file__), 'settings.sample.cfg')
re_keys = re.compile(r'^([a-zA-Z0-9_]+)\s*=')


def get_keys(filepath):
    keys = set()
    with open(filepath, 'r') as f:
        for line in f:
            match = re_keys.match(line)
            if match is not None:
                keys.add(match.group(1))
    return keys

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
        # Check if settings.cfg file needs an update
        fp = get_keys(settings_filepath)
        sfp = get_keys(settings_sample_filepath)
        if fp != sfp:
            print("\033[93m'settings.cfg' needs a manual update. The following keys from 'settings.sample.cfg' need to be added:\033[0m")
            print(sfp - fp)
            sys.exit(2)

check()

from flask import Flask
app = Flask(__name__)
app.config.from_pyfile('settings.cfg')
app.config['SCANNER_MODES'] = ['tags']

if app.config['SCANNER_FOLDER_PATTERNS'] is not None and len(app.config['SCANNER_FOLDER_PATTERNS']) > 0:
    app.config['SCANNER_MODES'].append('folder')
    for i, pattern in enumerate(app.config['SCANNER_FOLDER_PATTERNS']):
        app.config['SCANNER_FOLDER_PATTERNS'][i] = re.compile(pattern)

import logging
level = logging.DEBUG if app.config['DEBUG'] else logging.INFO
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=level)
