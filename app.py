import os
import sys

settings_filepath = os.path.join(os.path.dirname(__file__), 'settings.cfg')
settings_sample_filepath = os.path.join(os.path.dirname(__file__), 'settings.sample.cfg')

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

from flask import Flask
app = Flask(__name__)
app.config.from_pyfile('settings.cfg')