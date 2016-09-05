from festivallib import model as m


def add_column(engine, table, column):
    table_name = table.__tablename__
    column_name = column.name
    column_type = column.type.compile(engine.dialect)
    engine.execute('ALTER TABLE %s ADD COLUMN %s %s' % (table_name, column_name, column_type))


_l = [
    ('Nothing to do', None),  # 1
    ('Nothing to do', None),  # 2
    ('Adding column art_id to artist table', lambda engine: add_column(engine, m.Artist, m.Artist.art_id))  # 3
]


def migrate(version, engine):
    if version is None:
        version = 1
    if version < len(_l):
        print('Last version %d, current version: %d' % (len(_l), version))
        for i in range(version, len(_l) + 1):
            comment, migrate_fct = _l[i-1]
            print('#%d %s' % (i, comment))
            if migrate_fct is not None:
                migrate_fct(engine)
        print('Migration successful')
