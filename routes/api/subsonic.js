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

    this.routes.getIndexes = function(req, res, callback){
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

    this.routes.getMusicDirectory = function(req, res, callback){
        var id = ''+req.param('id');
        var cid = subsonicjson.clearId(id);
        if (id.length > 0) {
            if (subsonicjson.isArtistId(id)) {
                self.db.track.find({artist: cid}).group({
                    key: {artist: 1, album: 1},
                    reduce: function(curr, result) {
                        if (!result.year) result.year = curr.year;
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
                        var response = subsonicjson.getMusicDirectory(id, cid, docs);
                        callback(response);
                    }
                });
            } else if (subsonicjson.isAlbumId(id)) {
                self.db.track.find({album: cid[0], artist: cid[1]}).exec(function (err, docs) {
                    if (err){
                        console.error(err);
                    }else{
                        var response = subsonicjson.getMusicDirectory(id, cid[0], docs);
                        callback(response);
                    }
                });
            }
        } else {
            // TODO send error
        }
    };
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

api.prototype.router = function() {
    var router = express.Router();
    var self = this;
    for (var x in this.routes) {
        router.use('/' + x + '.view', function(req, res, next){
            self.preprocess(req, res, self.routes[x], next);
        });
    }
    return router;
};

module.exports = function(db) {
    return new api(db);
};
