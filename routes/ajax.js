var mongoose = require('mongoose'),
    path = require('path');

/**
 * Send HTML artist list
 */
exports.searchartists = function(req, res) {
    var term = req.body.term?req.body.term:null,
        render = req.query.render?req.query.render:null;
    if (term !== null && term !== '') {
        req.query.filters = JSON.stringify({artist : {$regex: '.*'+term+'.*', $options: 'i'}});
    }
    exports.listartists(req, res, function(list){
        res.render("tab/search", {
            artists: list
        });
    });
};

/**
 * JSON list of tracks
 */
exports.listtracks = function(req, res, callback){
    var filters = req.query.filters?JSON.parse(req.query.filters):{},
        Track = mongoose.model('track');
    var query = Track.find(filters);
    query.exec(function (err, docs) {
        if (callback){
            callback(docs);
        }else{
            res.json(docs);
        }
    });
};

/**
 * JSON list of albums by artists.
 * e.g.
 *   [{
 *     name: "artist1 name",
 *     albums: [
 *       {name: "album1 name", albumart: "http://mydomain.com/album1/art"},
 *       {name: "album2 name"},
 *     ]
 *   }, ...]
 */
exports.listalbumsbyartists = function(req, res){
    var filters = req.query.filters?JSON.parse(req.query.filters):{},
        Track = mongoose.model('track'),
        Albumart = mongoose.model('albumart'),
        albumsByArtists = [],
        lastArtist = null;
    
    // Fetch covers info
    Albumart.find({}).exec(function(err2, docs2) {
        var covers = {};
        for (var i=0; i<docs2.length; i++){
            covers[docs2[i].dir] = docs2[i]._id;
        }
        
        // Fetch tracks info
        Track.aggregate(
        {$match: filters},
        {$group: {_id: {album: '$album'}, year: {$first: '$year'}, artist: {$first: '$artist'}, first_path: {$first: '$path'}}},
        {$sort: {artist: 1, album: 1}},
        {$project: {_id: 0, artist: 1, year: 1, first_path: 1, album: '$_id.album'}},
        function(err, docs) {
            if (err){
                console.error(err);
            }else{
                for (var i=0; i<docs.length; i++){
                    var albumdir = path.dirname(docs[i].first_path),
                        album = {name: docs[i].album},
                        artist = docs[i].artist;
                    if (covers[albumdir]){
                        album.albumart = '/ajax/albumart/?id=' + covers[albumdir];
                    }
                    if (artist !== null){
                        if (lastArtist !== artist){
                            // add artist with first album
                            albumsByArtists.push({name: artist, albums: [album]});
                            lastArtist = artist;
                        } else {
                            // artist already exists, so only add album to it
                            albumsByArtists[albumsByArtists.length-1].albums.push(album);
                        }
                    }
                }
                res.json(albumsByArtists);
            }
        });
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
    {$sort: {artist: 1, album: 1}},
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
    {$sort: {artist: 1}},
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
