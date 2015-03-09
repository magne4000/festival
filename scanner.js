var fs = require('fs'),
    http = require('http'),
    settings = require('./settings'),
    temp = require('./lib/temp').track(),
    thumbs = require('./lib/thumbs'),
    coverurl = require('./lib/coverurl'),
    taglib = require('taglib'),
    path = require('path'),
    mime = require('mime'),
    uuid = require('node-uuid'),
    mongoose = require('mongoose'),
    filewalker = require('filewalker'),
    queue = require('queue-async'),
    t = 10000;

var Scanner = function() {
    this.progressTimeout = null;
    this.scanInProgess = false;
    this.rescanAfter = false;
    this.coverqueue = queue(10);
};

/**
 * Add or update track to database
 * @param filepath
 * @param mtime
 * @param tag
 * @param audioProperties
 */
Scanner.prototype.merge = function(filepath, mtime, tag, audioProperties){
    var Track = mongoose.model('track');
    var track = {
        path: filepath,
        last_updated: mtime
    }, self = this;
    if (tag === null){
        console.log(filepath, ': tag is null');
    } else {
        track.genre = tag.genre;
        track.album = tag.album;
        track.artist = tag.artist;
        track.name = tag.title;
        track.year = tag.year;
        track.trackno = tag.track;
    }
    if (audioProperties === null){
        console.log(filepath + ' : unable to retrieve audio properties');
    }else{
        track.duration = audioProperties.length;
        track.bitrate = audioProperties.bitrate;
        track.frequency = audioProperties.sampleRate;
    }
    track.mime = mime.lookup(track.path);
    Track.update({ path: filepath }, track, {upsert: true}, function(err, a, b){
        console.log(filepath, ': updated');
        self.clearProgressTimeout();
    });
};

/**
 * Delete files that are not on the filesystem anymore
 * @param files
 */
Scanner.prototype.cleanold = function(files){
    var Track = mongoose.model('track'),
        Albumart = mongoose.model('albumart'),
        albumartsToDelete = [],
        filesToDelete = [];
    
    // Clean old tracks
    if (files) {
        Object.keys(files).forEach(function(element) {
            filesToDelete.push(element);
        });
        Track.remove({path: {$in: filesToDelete}}).exec();
        if (settings.debug) {
            console.log('Cleared files', filesToDelete);
        }
    }
    
    this.clearProgressTimeout();
};

function mkthumbnail(frompath, artist, album) {
    var Albumart = mongoose.model('albumart');
    if (frompath === null) {
        var oalbum = {artist: artist, album: album, path: null};
        var newalbumart = new Albumart(oalbum);
        newalbumart.save(function (err, newDoc) {
            if (err){
                console.error(err);
            }
        });
    } else {
        thumbs.create(frompath, uuid.v4(), 140, 140, function(err, thumbpath){
            if (err) {
                console.error('Error while making thumbnail with "' + frompath + '"');
                console.error(err);
                mkthumbnail(null, artist, album);
            } else {
                var oalbum = {artist: artist, album: album, path: thumbpath};
                var newalbumart = new Albumart(oalbum);
                newalbumart.save(function (err2, newDoc) {
                    if (err2){
                        console.error(err2);
                    } else {
                        if (settings.debug) {
                            console.log('album art saved :', thumbpath);
                        }
                    }
                });
            }
        });
    }
}

Scanner.prototype.updateAlbumArts = function(callback){
    var Track = mongoose.model('track'),
        Albumart = mongoose.model('albumart'),
        self = this,
        promise = null;

    Albumart.find({}).exec(function(err2, docs2) {
        var covers = [];
        for (var i=0; i<docs2.length; i++){
            var artist = docs2[i].artist.trim().toLowerCase();
            var album = docs2[i].album.trim().toLowerCase();
            if (typeof covers[artist] == 'undefined') {
                covers[artist] = [];
            }
            covers[artist].push(album);
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

        Track.aggregate(
            {$match: {}},
            {$group: {_id: {album: '$album'}, year: {$first: '$year'}, artist: {$first: '$artist'}, first_path: {$first: '$path'}}},
            {$sort: {artist: 1, album: 1}},
            {$project: {_id: 0, artist: 1, year: 1, first_path: 1, album: '$_id.album'}},
            function(err, docs) {
                if (err) {
                    console.error(err);
                } else {
                    for (var i=0; i<docs.length; i++){
                        var album = docs[i].album,
                            artist = docs[i].artist;
                        if (artist !== null && album !== null && !coverexists(artist, album)){
                            if (settings.debug) {
                                console.log('No cover for', artist, '-', album);
                            }
                            self.fetchCoverOnline(artist, album, mkthumbnail);
                        }
                    }
                }
            }
        );

        self.coverqueue.awaitAll(function(){
            clearTimeout(promise);
            promise = setTimeout(callback, 10000);
        });
    });
};

/**
 * Update the scanInProgess boolean
 */
Scanner.prototype.clearProgressTimeout = function(){
    clearTimeout(this.progressTimeout);
    this.progressTimeout = setTimeout(function(){
        scanInProgess = false;
    }, t);
};

/**
 *  Test if filepath's extension is in exts.
 */
Scanner.prototype.isTypeFile = function(filepath, exts){
    var fileext = path.extname(filepath);
    for (var key in exts){
        if (exts[key].trim().toLowerCase() === fileext){
            return true;
        }
    }
    return false;
};

/**
 * Test if filepath is a music file.
 * Based on extensions from settings.js file
 */
Scanner.prototype.isMusicFile = function(filepath){
    var exts = settings.scanner.musicExts.split(',');
    return this.isTypeFile(filepath, exts);
};

/**
 * Test if filepath is a cover file.
 */
Scanner.prototype.isCoverFile = function(filepath){
    var exts = settings.scanner.coverExts.split(',');
    return this.isTypeFile(filepath, exts);
};

/**
 * Fetch cover with lastfm API, then create thumbnail
 */
Scanner.prototype.fetchCoverOnline = function(artist, album, callback){
    var self = this;
    coverurl(settings.lastfm.api_key, artist, album, function(err, url) {
        if (err) {
            if (settings.debug) {
                console.log('fetchCoverOnline ERROR');
                console.log(err);
            }
            callback(null, artist, album);
        } else {
            if (url === null) {
                callback(null, artist, album);
            } else {
                self.coverqueue.defer(function(url2, artist2, album2, next){
                    http.get(url2, function(res) {
                        var temppath = temp.path('festival');
                        var wstream = temp.createWriteStream(undefined, temppath);
                        res.pipe(wstream).on('close', function(){
                            callback(temppath, artist2, album2);
                        });
                        next();
                    }).on('error', function(e) {
                        console.log("Error in fetchCoverOnline", url2);
                        console.log(e);
                        callback(null, artist2, album2);
                        next();
                    });
                }, url, artist, album);
            }
        }
    });
};

/**
 * Walk through folder defined in settings.json in order
 * to retrieve music files
 */
Scanner.prototype.scan = function(){
    var self = this,
        Track = mongoose.model('track'),
        Albumart = mongoose.model('albumart');
    if (!this.scanInProgess){
        this.scanInProgess = true;
        if (settings.debug) {
            console.log('Scan started.');
        }
        Track.find(
            {},
            "path last_updated",
            function(err, docs) {
                if (err) console.error(err);
                var files = {};
                for (var i in docs) {
                    if (docs.hasOwnProperty(i)) {
                        files[docs[i].path] = docs[i].last_updated;
                    }
                }
            
                var walker = filewalker(settings.scanner.path);
                var myqueue = queue(100);

                walker.on("file", function(rpath, fileStats, filepath) {
                    if (self.isMusicFile(filepath) && (!files[filepath] || fileStats.mtime > files[filepath])){
                        console.log(filepath);
                        if (settings.debug) {
                            console.log('Reading tags : ' + filepath);
                        }
                        delete files[filepath];
                        myqueue.defer(function(filepath2, fileStats2, next) {
                            taglib.read(filepath2, function(err, tag, audioProperties){
                                if (tag) {
                                    self.merge(filepath2, fileStats2.mtime, tag, audioProperties);
                                } else {
                                    console.log("No tags for", filepath2, "?");
                                }
                                next();
                            });
                        }, filepath, fileStats);
                    }else{
                        delete files[filepath];
                    }
                });

                walker.on('error', function(error){
                    console.log('walker ERROR');
                    console.error(error);
                });

                walker.on("done", function () {
                    myqueue.awaitAll(function() {
                        self.cleanold(files);
                        // Update covers
                        self.updateAlbumArts(function(){
                            // Optimize mongodb here ?
                            self.scanInProgess = false;
                            if (settings.debug) {
                                console.log('Update finished.');
                            }
                            if (self.rescanAfter) {
                                self.rescanAfter = false;
                                self.scan();
                            }
                        });
                    });
                });

                walker.walk();
            }
        );
    } else {
        self.rescanAfter = true;
    }
};

var Watcher = function() {
    this.scanner = new Scanner();
    this.scanTimeout = null;
};

/**
 * Launch scan after t milliseconds
 */
Watcher.prototype.scan = function(){
    var self = this;
    clearTimeout(this.scanTimeout);
    this.scanTimeout = setTimeout(function() {
        temp.cleanupSync();
        self.scanner.scan();
    }, t);
};

/**
 * Watch folder defined in settings.json and then call scan()
 * if an event is triggered
 */
Watcher.prototype.watch = function(){
    var self = this;
    // Try to scan every 5 minutes
    setInterval(function(){
        self.scan();
    }, 300000);
};

module.exports = new Watcher();
