/**
 * Module dependencies.
 */

var express =
    require('express'),
    routes = require('./routes'),
    ajax = require('./routes/ajax'),
    music = require('./routes/music'),
    scanner = require('./scanner'),
    http = require('http'),
    path = require('path'),
    config = require('./settings'),
    mongoose = require('mongoose'),
    fs = require('fs'),
    connectJadeClient = require("connect-jade-client");

var app = express();

// all environments
app.set('port', process.env.PORT || config.express.port || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon(path.join(__dirname, 'public', 'images', 'favicon.png')));
app.use(express.logger('dev'));
app.use(express.compress());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(connectJadeClient({
    source: path.join(__dirname, "views"),
    public: path.join(__dirname, "public"),
    prefix: "/js/templates"
}));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/music/:id', music.index);
app.post('/ajax/search/artists', ajax.searchartists);
app.get('/ajax/list/tracks', ajax.listtracks);
app.get('/ajax/list/albums', ajax.listalbums);
app.get('/ajax/list/artists', ajax.listartists);
app.get('/ajax/list/albumsbyartists', ajax.listalbumsbyartists);
app.get('/ajax/fileinfo', ajax.fileinfo);
app.get('/ajax/albumart', ajax.albumart);
app.get('/ajax/hasalbumart', ajax.hasalbumart);

mongoose.connect(config.mongodb.url);

//Bootstrap models
var models_path = path.join(__dirname, 'models');
fs.readdirSync(models_path).forEach(function(file) {
    if (~file.indexOf('.js')) {
        require(path.join(models_path, file));
    }
});

//Watcher
scanner.watch();

//launch a first scan
scanner.scan();

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
