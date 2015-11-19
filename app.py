import os
import sys
import re
import logging
from festivallib.data import Data
from sqlalchemy import create_engine, inspect
from sqlalchemy.ext.declarative.clsregistry import _ModuleMarker
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import RelationshipProperty
from sqlalchemy.engine.reflection import Inspector


settings_filepath = os.path.join(os.path.dirname(__file__), 'settings.cfg')
settings_sample_filepath = os.path.join(os.path.dirname(__file__), 'settings.sample.cfg')


def get_engine(myapp):
    return create_engine(myapp.config['SQLALCHEMY_DATABASE_URI'], poolclass=NullPool, connect_args={'check_same_thread': False})


def is_sane_database(app):
    from festivallib.model import Base
    engine = get_engine(app)
    inspector = Inspector.from_engine(engine)

    errors = False

    tables = inspector.get_table_names()

    logger = logging.getLogger('is_sane_database')

    # Go through all SQLAlchemy models
    for name, klass in Base._decl_class_registry.items():

        if isinstance(klass, _ModuleMarker):
            # Not a model
            continue

        table = klass.__tablename__
        if table in tables:
            # Check all columns are found
            # Looks like [{'default': "nextval('sanity_check_test_id_seq'::regclass)", 'autoincrement': True, 'nullable': False, 'type': INTEGER(), 'name': 'id'}]

            columns = [c["name"] for c in inspector.get_columns(table)]
            mapper = inspect(klass)

            for column_prop in mapper.attrs:
                if isinstance(column_prop, RelationshipProperty):
                    # TODO: Add sanity checks for relations
                    pass
                else:
                    for column in column_prop.columns:
                        # Assume normal flat column
                        if not column.key in columns:
                            logger.error("Model %s declares column %s which does not exist in database %s", klass, column.key, engine)
                            errors = True
        else:
            logger.error("Model %s declares table %s which does not exist in database %s", klass, table, engine)
            errors = True

    return not errors


def get_config(filename):
    c = {}
    obj = {}
    with open(filename) as config_file:
        exec(compile(config_file.read(), filename, 'exec'), c)
    for key in c:
        if key.isupper():
            obj[key] = c[key]
    return obj


def get_app():
    from flask import Flask
    app = Flask(__name__)
    app.config.from_pyfile('settings.cfg')
    app.config['SCANNER_MODES'] = ['tags']
    if app.config['SCANNER_FOLDER_PATTERNS'] is not None and len(app.config['SCANNER_FOLDER_PATTERNS']) > 0:
        app.config['SCANNER_MODES'].append('folder')
        for i, pattern in enumerate(app.config['SCANNER_FOLDER_PATTERNS']):
            app.config['SCANNER_FOLDER_PATTERNS'][i] = re.compile(pattern)
    return app


def check_and_get_app():
    app = None
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
        c = get_config(settings_filepath)
        c_sample = get_config(settings_sample_filepath)
        config_diff = set(c_sample.keys()) - set(c.keys())
        if len(config_diff) > 0:
            print("\033[93m'settings.cfg' needs a manual update. The following keys from 'settings.sample.cfg' need to be added:\033[0m")
            print("\t", "\n\t".join(config_diff), sep='')
            sys.exit(2)

        app = get_app()
        if not is_sane_database(app):
            print("\033[93mModel changed since last update. Database and covers will be deleted.\033[0m")
            resp = input('Continue ? [y/N] ')
            if resp.lower() == 'y':
                Data.clear()
            else:
                print("\033[93mArborting.\033[0m")
                sys.exit(3)
    if app is None:
        app = get_app()
    return app


app = check_and_get_app()


level = logging.DEBUG if app.config['DEBUG'] else logging.INFO
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=level)
