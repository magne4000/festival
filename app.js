/**
 * Module dependencies.
 */

var express = require('express'),
    compression = require('compression'),
    morgan  = require('morgan'),
    serveStatic = require('serve-static'),
    errorhandler = require('errorhandler'),
    bodyParser = require('body-parser'),
    path = require('path'),
    settings = require('./settings'),
    Datastore = require('nedb'),
    db = {
        track: new Datastore({ filename: settings.nedb.dir+settings.nedb.dbs.track, autoload: true }),
        albumart: new Datastore({ filename: settings.nedb.dir+settings.nedb.dbs.albumart, autoload: true })
    },
    index = require('./routes/index')(db),
    ajax = require('./routes/ajax')(db),
    music = require('./routes/music')(db),
    scanner = require('./scanner')(db),
    fs = require('fs');

// nedb indexes
db.track.ensureIndex({ fieldName: 'artist' });
db.track.ensureIndex({ fieldName: 'album' });

// express
var app = express();

// all environments
app.set('port', process.env.PORT || settings.express.port || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
//app.use(express.favicon(path.join(__dirname, 'public', 'images', 'favicon.png')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(morgan('combined'));
app.use(compression());
app.use(serveStatic(path.join(__dirname, 'public')));

// development only
if ('development' === process.env.NODE_ENV) {
    app.use(errorhandler());
}
app.get('/', index.index.bind(index));
app.get('/music/:id', music.index.bind(music));
app.post('/ajax/search/artists', ajax.searchartists.bind(ajax));
app.get('/ajax/list/tracks', ajax.listtracks.bind(ajax));
app.get('/ajax/list/albums', ajax.listalbums.bind(ajax));
app.get('/ajax/list/artists', ajax.listartists.bind(ajax));
app.get('/ajax/list/albumsbyartists', ajax.listalbumsbyartists.bind(ajax));
app.get('/ajax/fileinfo', ajax.fileinfo.bind(ajax));
app.get('/ajax/albumart', ajax.albumart.bind(ajax));

//Watcher
scanner.watch();

//launch a first scan
scanner.scan();

app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
