var mongoose = require('mongoose'),
    path = require('path'),
    fs = require('fs');

/**
 * Send HTML artist list
 */
exports.menu = function(req, res) {
    // TODO
    var i = req.body.i;
    if (i == 2) {
        res.send("0");
    } else {
        exports.listartists(req, res, function(list){
            res.render("menu", {
                artists: list
            });
        });
    }
};

/**
 * JSON list of tracks
 */
exports.listtracks = function(req, res){
    var filters = req.query.filters?JSON.parse(req.query.filters):{},
        Track = mongoose.model('track');
    var query = Track.find(filters);
    query.exec(function (err, docs) {
        res.json(docs);
    });
};

/**
 * JSON list of albums
 */
exports.listalbums = function(req, res){
    var filters = req.query.filters?JSON.parse(req.query.filters):{},
        Track = mongoose.model('track');
    Track.aggregate(
    {$match: filters},
    {$group: {_id: {album: '$album'}, year: {$first: '$year'}, artist: {$first: '$artist'}}},
    {$project: {_id: 0, artist: 1, year: 1, album: '$_id.album'}},
    function(err, docs) {
        if (err){
            console.error(err);
        }else{
            res.json(docs);
        }
    });
};

/**
 * JSON list of artists
 */
exports.listartists = function(req, res, callback){
    var filters = req.query.filters?JSON.parse(req.query.filters):{},
        Track = mongoose.model('track');
    Track.aggregate(
    {$match: filters},
    {$group: {_id: {artist: '$artist'}}},
    {$project: {_id: 0, artist: '$_id.artist'}},
    function(err, docs) {
        if (err){
            console.error(err);
        }else{
            if (callback){
                callback(docs);
            }else{
                res.json(docs);
            }
        }
    });
};

exports.fileinfo = function(req, res){
    var ids = req.query.ids?JSON.parse(req.query.ids):null,
        Track = mongoose.model('track');
    console.log(ids);
    if (ids !== null){
        Track.find({ _id : {$in: ids.ids}}, function (err, tracks) {
            if (err) {
                console.error(err);
            } else if (tracks) {
                res.send(tracks);
            } else {
                res.send(500);
            }
        });
    }else{
        res.send(500);
    }
};

exports.albumart = function(req, res){
    var id = req.query.id?req.query.id:null,
        Albumart = mongoose.model('albumart');

    Albumart.findOne({_id: id}).exec(function(err, cover) {
        res.sendfile(cover.path);
    });
};

exports.hasalbumart = function(req, res){
    var album = req.query.album?JSON.parse(req.query.album):null,
        Track = mongoose.model('track'),
        Albumart = mongoose.model('albumart');
    var query = Track.findOne({$and: [{album: album.album}, {artist: album.artist}]});
    query.exec(function (err, doc) {
        if (err){
            console.error(err);
            res.send(false);
        }else{
            if (doc){
                var albumdir = path.dirname(doc.path);
                Albumart.findOne({dir: albumdir}).exec(function(err2, cover) {
                    if (err2 || !cover) {
                        if (err2) console.log(err2);
                        res.send(false);
                    } else {
                        res.send(cover._id);
                    }
                });
            }else{
                res.send(false);
            }
        }
    });
};
