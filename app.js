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
    mongoose = require('mongoose'),
    index = require('./routes/index'),
    ajax = require('./routes/ajax'),
    music = require('./routes/music'),
    scanner = require('./scanner'),
    subsonicapi = require('./routes/api/subsonic'),
    fs = require('fs');

mongoose.connect(settings.mongodb.uri);


//Bootstrap models
var models_path = path.join(__dirname, 'models');
fs.readdirSync(models_path).forEach(function(file) {
    if (~file.indexOf('.js')) {
        require(path.join(models_path, file));
    }
});

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
app.use('/rest', subsonicapi.router());

//Watcher
scanner.watch();

//launch a first scan
scanner.scan();

app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
