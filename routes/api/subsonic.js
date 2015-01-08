var express = require('express'),
    SubsonicJson = require('./subsonicjson'),
    jsonix = require('./jsonix'),
    jsonixcontext = require('./jsonix-context'),
    settings = require('../../settings'),
    subsonicjson = new SubsonicJson;

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

    this.routes.getSong = function(req, res, callback){
        var id = req.param('id');
        var cid = subsonicjson.clearId(id);
        if (id.length > 0) {
            self.getSongs({_id: cid}, function(docs) {
                if (docs.length === 1) {
                    var response = subsonicjson.getSong(id, docs[0]);
                    callback(response);
                } else {
                    // TODO send error
                }
            });
        } else {
            // TODO send error
        }
    };

    this.routes.getVideos = function(req, res, callback){
        var response = subsonicjson.getEmpty('videos');
        callback(response);
    };
    
    this.routes.getSimilarSongs2 = this.routes.getSimilarSongs
        = this.routes.getArtistInfo2 = this.routes.getArtistInfo
        = function(req, res, callback){
        var response = subsonicjson.createError(SubsonicJson.SSERROR_DATA_NOTFOUND);
        callback(response, true);
    };

    function getFilterByType(type, options) {
        var filter;
        switch (type) {
            case 'starred':
                filter = {_id: 0}; // because we have no starred albums
                break;
            case 'byYear':
                filter = {year: {$gte: parseInt(options.fromYear, 10), $lte: parseInt(options.toYear, 10)}}
                break;
            case 'genre':
                filter = {genre: options.genre};
                break;
            default:
                filter = {};
        }
        return filter;
    }

    function getSortByType(type) {
        var sort;
        switch (type) {
            case 'newest':
                sort = {last_updated: 1};
                break;
            case 'alphabeticalByName':
                sort = {album: 1};
                break;
            default:
                sort = {album: 1, artist: 1};
        }
        return sort;
    }

    this.routes.getAlbumList2 = function(req, res, callback){
        self.routes.getAlbumList(req, res, callback, subsonicjson.getAlbumList2);
    }

    this.routes.getAlbumList = function(req, res, callback, subsonicfct){
        var error = null;
        var type = req.param('type', null);
        var size = Math.max(Math.min(req.param('size', 10), 500), 1);
        var offset = Math.max(req.param('offset', 0), 0);
        var fromYear = req.param('fromYear', null);
        var toYear = req.param('toYear', null);
        var genre = req.param('genre', null);

        if (type === 'random') {
            error = SubsonicJson.SSERROR_DATA_NOTFOUND;
        } else if (type === null) {
            error = SubsonicJson.SSERROR_MISSINGPARAM;
        } else if (type === 'byYear' && (fromYear === null || toYear === null)) {
            error = SubsonicJson.SSERROR_MISSINGPARAM;
        } else if (type === 'genre' && genre === null) {
            error = SubsonicJson.SSERROR_MISSINGPARAM;
        }
        
        if (error === null) {
            var filter = getFilterByType(type);
            var sort = getSortByType(type, {fromYear: fromYear, toYear: toYear, genre: genre});

            var query = self.db.track.find(filter).group({
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
            }).sort(sort).skip(offset).limit(size).exec(function(err, docs) {
                if (err){
                    console.error(err);
                }else{
                    var fct = subsonicfct;
                    if (typeof fct != 'function') fct = subsonicjson.getAlbumList;
                    var response = fct.call(subsonicjson, docs);
                    callback(response);
                }
            });
        } else {
            var response = subsonicjson.createError(error);
            callback(response, true);
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
    callback(req, res, function(response, error) {
        if (error) format = 'xml';
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
