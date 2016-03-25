import re
from flask import Flask
from datetime import timedelta


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


app = get_app()