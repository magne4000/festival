var path = require('path'),
    uniqid = require('../lib/uniqid')
    thumbs = require('../lib/thumbs');

//https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function cleanJsonTrack(track) {
    delete track.path;
    track.url = '/music/' + track._id;
    track.uniqid = uniqid();
    return track;
}


var ajax = function(db) {
    this.db = db;
};

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
        playing = req.query.playing?req.query.playing:false;
    var query = this.db.track.find(filters);
    query.exec(function (err, docs) {
        if (render){
            res.render("tab/playlist", {
                tracks: docs,
                filters: filters,
                playing: playing
            });
        } else {
            docs.forEach(cleanJsonTrack);
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
        self = this;
    
    // Fetch covers info
    this.db.albumart.find({}).exec(function(err2, docs2) {
        var covers = {};
        for (var i=0; i<docs2.length; i++){
            covers[docs2[i].dir] = docs2[i]._id;
        }

        // Fetch tracks info
        self.db.track.find(filters).group({
            key: {artist: 1, album: 1},
            reduce: function(curr, result) {
                // Get one of the path in order to get the folder
                // path afterwards
                result.path = curr.path;
                return result;
            },
            initial: {}
        }).sort({artist: 1, album: 1}).exec(function(err, docs) {
            if (err){
                console.error(err);
            }else{
                for (var i=0; i<docs.length; i++){
                    var albumdir = path.dirname(docs[i].path),
                        album = {name: docs[i].album},
                        artist = docs[i].artist;
                    if (covers[albumdir]){
                        album.albumart = '/ajax/albumart/?id=' + covers[albumdir];
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
        });
    });
};

/**
 * JSON list of albums
 */
ajax.prototype.listalbums = function(req, res){
    var filters = req.query.filters?JSON.parse(req.query.filters):{};
    this.db.track.find(filters).group({
        key: {artist: 1, album: 1},
        reduce: function(curr, result) {},
        initial: {}
    }).sort({artist: 1, album: 1}).exec(function(err, docs) {
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
ajax.prototype.listartists = function(req, res, callback){
    var filters = req.query.filters?req.query.filters:{};
    if (typeof callback !== 'function'){
        filters = JSON.parse(filters);
    }
    this.db.track.find(filters).group({
        key: {artist: 1},
        reduce: function(curr, result) {},
        initial: {}
    }).sort({artist: 1}).exec(function(err, docs) {
        if (err){
            console.error(err);
        }else{
            if (typeof callback === 'function'){
                callback(docs);
            }else{
                res.json(docs);
            }
        }
    });
};

ajax.prototype.fileinfo = function(req, res){
    var ids = req.query.ids?JSON.parse(req.query.ids):null;
    if (ids !== null){
        this.db.track.find({ _id : {$in: ids.ids}}, function (err, tracks) {
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

ajax.prototype.albumart = function(req, res){
    var id = req.query.id?req.query.id:null,
        thumbpath = thumbs.path(id);
    if (thumbpath !== null) {
        res.sendfile(thumbpath);
    } else {
        res.send(404);
    }
};

ajax.prototype.hasalbumart = function(req, res){
    var album = req.query.album?JSON.parse(req.query.album):null;
    var query = this.db.track.findOne({$and: [{album: album.album}, {artist: album.artist}]});
    var self = this;
    query.exec(function (err, doc) {
        if (err){
            console.error(err);
            res.send(false);
        }else{
            if (doc){
                var albumdir = path.dirname(doc.path);
                this.db.albumart.findOne({dir: albumdir}).exec(function(err2, cover) {
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

module.exports = function(db) {
    return new ajax(db);
};
