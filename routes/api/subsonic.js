var express = require('express'),
    subsonicjson = require('./subsonicjson')(),
    jsonix = require('./jsonix'),
    jsonixcontext = require('./jsonix-context'),
    settings = require('../../settings');

var api = function(db) {
    var self = this;
    this.db = db;
    this.context = new jsonix.Jsonix.Context([jsonixcontext]);
    this.routes = {};
    
    this.routes.ping = function(req, res, callback){
        var response = subsonicjson.createSuccessResponse();
        callback(response);
    };

    this.routes.getLicense = function(req, res, callback){
        var response = subsonicjson.getLicense();
        callback(response);
    };

    this.routes.getMusicFolders = function(req, res, callback){
        var response = subsonicjson.getMusicFolders();
        callback(response);
    };

    this.routes.getArtists = this.routes.getIndexes = function(req, res, callback){
        // var musicFolderId = req.param('musicFolderId');
        // var ifModifiedSince = req.param('ifModifiedSince');
        self.db.track.find({}).group({
            key: {artist: 1},
            reduce: function(curr, result) {},
            initial: {}
        }).sort({artist: 1}).exec(function(err, docs) {
            if (err){
                console.error(err);
            }else{
                var response = subsonicjson.getIndexes(docs);
                callback(response);
            }
        });
    };

    
    this.routes.getArtist = function(req, res, callback){
        var id = req.param('id');
        var cid = subsonicjson.clearId(id);
        self.getAlbumsByArtists({artist: cid}, function(docs){
            var response = subsonicjson.getArtist(id, docs);
            callback(response);
        });
    };

    this.routes.getMusicDirectory = function(req, res, callback){
        var id = req.param('id');
        var cid = subsonicjson.clearId(id);
        if (id.length > 0) {
            if (subsonicjson.isArtistId(id)) {
                self.getAlbumsByArtists({artist: cid}, function(docs){
                    var response = subsonicjson.getMusicDirectory(id, cid, docs);
                    callback(response);
                });
            } else if (subsonicjson.isAlbumId(id)) {
                self.getSongs({album: cid[0], artist: cid[1]}, function (docs) {
                    var response = subsonicjson.getMusicDirectory(id, cid[0], docs);
                    callback(response);
                });
            }
        } else {
            // TODO send error
        }
    };
    
    this.routes.getGenres = function(req, res, callback){
        self.db.track.find({}).group({
            key: {genre: 1},
            reduce: function(curr, result) {},
            initial: {}
        }).sort({genre: 1}).exec(function(err, docs) {
            if (err){
                console.error(err);
            }else{
                var response = subsonicjson.getGenres(docs);
                callback(response);
            }
        });
    };

    this.routes.getAlbum = function(req, res, callback){
        var id = req.param('id');
        var cid = subsonicjson.clearId(id);
        if (id.length > 0) {
            self.getSongs({album: cid[0], artist: cid[1]}, function(docs) {
                var response = subsonicjson.getAlbum(id, cid, docs);
                callback(response);
            });
        } else {
            // TODO send error
        }
    };
};

api.prototype.getAlbumsByArtists = function(filter, callback) {
    this.db.track.find(filter).group({
        key: {artist: 1, album: 1},
        reduce: function(curr, result) {
            if (!result.year) result.year = curr.year;
            if (!result.last_updated) result.last_updated = curr.last_updated;
            result.songCount += 1;
            if (curr.duration) result.duration += curr.duration;
        },
        initial: {
            duration: 0,
            songCount: 0
        }
    }).sort({artist: 1, album: 1}).exec(function(err, docs) {
        if (err){
            console.error(err);
        }else{
            callback(docs);
        }
    });
};

api.prototype.getSongs = function(filter, callback) {
    this.db.track.find(filter).exec(function(err, docs) {
        if (err){
            console.error(err);
        }else{
            callback(docs);
        }
    });
};

api.prototype.preprocess = function(req, res, callback, next){
    var self = this;
    var user = req.param('u');
    var password = req.param('p');
    var version = req.param('v');
    var client = req.param('c');
    var format = req.param('f', 'xml');
    callback(req, res, function(response) {
        switch (format) {
            case 'json':
                res.json(response);
                break;
            case 'jsonp':
                res.jsonp(response);
                break;
            default:
                var marshaller = self.context.createMarshaller(); 
                var doc = marshaller.marshalString({
                    name: { localPart: "subsonic-response" },
                    value: response['subsonic-response']
                });
                res.set('Content-Type', 'text/xml');
                res.send(doc);
        }
        next();
    });
};

api.prototype.serveview = function(fct){
    var self = this;
    return function serveview(req, res, next) {
        self.preprocess(req, res, fct, next); 
    };
};

api.prototype.router = function() {
    var router = express.Router();
    for (var x in this.routes) {
        var fct = this.routes[x];
        router.get('/' + x + '.view', this.serveview(fct));
    }
    return router;
};

module.exports = function(db) {
    return new api(db);
};
