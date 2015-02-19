var mongoose = require('mongoose'),
    path = require('path'),
    thumbs = require('../lib/thumbs');

//https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

var ajax = function() {};

/**
 * Send HTML artist list
 */
ajax.prototype.searchartists = function(req, res) {
    var term = req.body.term?req.body.term:null,
        render = req.query.render?req.query.render:null;
    if (term !== null && term !== '') {
        term = escapeRegExp(term);
        req.query.filters = {artist : {$regex: new RegExp('.*'+term+'.*', 'i')}};
    }
    this.listartists(req, res, function(list){
        res.json({
            artists: list
        });
    });
};

/**
 * JSON list of tracks
 */
ajax.prototype.listtracks = function(req, res){
    var filters = req.query.filters?JSON.parse(req.query.filters):{},
        render = req.query.render?req.query.render:null,
        playing = req.query.playing?req.query.playing:false,
        Track = mongoose.model('track');
    var query = Track.find(filters);
    query.exec(function (err, docs) {
        if (render){
            res.render("tab/playlist", {
                tracks: docs,
                filters: filters,
                playing: playing
            });
        } else {
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
ajax.prototype.listalbumsbyartists = function(req, res){
    var filters = req.query.filters?JSON.parse(req.query.filters):{},
        render = req.query.render?req.query.render:null,
        albumsByArtists = [],
        lastArtist = null,
        Track = mongoose.model('track'),
        Albumart = mongoose.model('albumart'),
        self = this;
    
    // Fetch covers info
    Albumart.find({}).exec(function(err2, docs2) {
        var covers = [];
        for (var i=0; i<docs2.length; i++){
            if (docs2[i].path !== null) {
                var artist = docs2[i].artist.trim().toLowerCase();
                var album = docs2[i].album.trim().toLowerCase();
                if (typeof covers[artist] == 'undefined') {
                    covers[artist] = [];
                }
                covers[artist].push(album);
            }
        }

        function coverexists(artist, album) {
            artist = artist.trim().toLowerCase();
            album = album.trim().toLowerCase();
            if (typeof covers[artist] != 'undefined'){
                if (covers[artist].indexOf(album) !== -1) {
                    return true;
                }
            }
            return false;
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
                        var albumdir = path.dirname(docs[i].path),
                            album = {name: docs[i].album},
                            artist = docs[i].artist;
                        if (coverexists(docs[i].artist, docs[i].album)){
                            album.albumart = '/ajax/albumart/?album=' + encodeURIComponent(docs[i].album) + '&artist=' + encodeURIComponent(docs[i].artist);
                        }else{
                            // Default cover when none found
                            album.albumart = '/images/nocover.png';
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
                    if (render !== null){
                        res.render("tab/albums", {
                            artists: albumsByArtists
                        });
                    }else{
                        res.json(albumsByArtists);
                    }
                }
            }
        );
    });
};

/**
 * JSON list of albums
 */
ajax.prototype.listalbums = function(req, res){
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
        }
    );
};

/**
 * JSON list of artists
 */
ajax.prototype.listartists = function(req, res, callback){
    var filters = req.query.filters?req.query.filters:{},
        Track = mongoose.model('track');
    if (typeof callback !== 'function'){
        filters = JSON.parse(filters);
    }
    Track.aggregate(
        {$match: filters},
        {$group: {_id: {artist: '$artist'}}},
        {$project: {_id: 0, artist: '$_id.artist'}},
        {$sort: {artist: 1}},
        function(err, docs) {
            if (err){
                console.error(err);
            }else{
                if (typeof callback === 'function'){
                    callback(docs);
                }else{
                    res.json(docs);
                }
            }
        }
    );
};

ajax.prototype.fileinfo = function(req, res){
    var ids = req.query.ids?JSON.parse(req.query.ids):null,
        Track = mongoose.model('track');
    if (ids !== null){
        Track.find({ _id : {$in: ids.ids}}, function (err, tracks) {
            if (err) {
                console.error(err);
            } else if (tracks) {
                res.send(tracks);
            } else {
                res.sendStatus(500);
            }
        });
    }else{
        res.sendStatus(500);
    }
};

ajax.prototype.albumart = function(req, res){
    var album = req.query.album;
    var artist = req.query.artist;
    var Albumart = mongoose.model('albumart');
    var query = Albumart.findOne({album: album, artist: artist});
    query.exec(function (err, doc) {
        if (err) {
            console.error(err);
            res.sendStatus(404);
        } else {
            if (doc && doc.path !== null) {
                res.sendFile(doc.path);
            } else {
                res.sendStatus(404);
            }
        }
    });
};

module.exports = new ajax();
