var fs = require('fs'),
    http = require('http'),
    settings = require('./settings'),
    temp = require('./lib/temp').track(),
    thumbs = require('./lib/thumbs'),
    coverurl = require('./lib/coverurl'),
    walk = require('walk'),
    taglib = require('taglib'),
    path = require('path'),
    watchr = require('watchr'),
    mime = require('mime'),
    uuid = require('node-uuid'),
    t = 10000;

var Scanner = function(db) {
    this.db = db;
    this.progressTimeout = null;
    this.scanInProgess = false;
    this.rescanAfter = false;
};

/**
 * Add or update track to database
 * @param filepath
 * @param mtime
 * @param tag
 * @param audioProperties
 */
Scanner.prototype.merge = function(filepath, mtime, tag, audioProperties){
    var track = {
        path: filepath,
        last_updated: mtime
    }, self = this;
    if (tag === null){
        console.log(filepath + ' : tag is null');
    } else {
        track.genre = tag.genre;
        track.album = tag.album;
        track.artist = tag.artist;
        track.name = tag.title;
        track.year = tag.year;
        track.trackno = tag.track;
    }
    if (audioProperties === null){
        console.log(filepath + ' : enable to retrieve audio properties');
    }else{
        track.duration = audioProperties.length;
        track.bitrate = audioProperties.bitrate;
        track.frequency = audioProperties.sampleRate;
    }
    track.mime = mime.lookup(track.path);
    this.db.track.update({ path: filepath }, track, {upsert: true}, function(err, a, b){
        console.log(filepath + ' : updated');
        self.clearProgressTimeout();
    });
}

/**
 * Delete files that are not on the filesystem anymore
 * @param files
 */
Scanner.prototype.cleanold = function(files, albumarts){
    var albumartsToDelete = [],
        filesToDelete = [];
    
    // Clean old tracks
    Object.keys(files).forEach(function(element) {
        filesToDelete.push(element);
    });
    this.db.track.remove({path: {$in: filesToDelete}});
    
    // Clean old covers
    Object.keys(albumarts).forEach(function(element) {
        albumartsToDelete.push(element);
        thumbs.remove(element);
    });
    this.db.albumart.remove({path: {$in: albumartsToDelete}});
    
    this.clearProgressTimeout();
}

/**
 * Update the scanInProgess boolean
 */
Scanner.prototype.clearProgressTimeout = function(){
    clearTimeout(this.progressTimeout);
    this.progressTimeout = setTimeout(function(){
        scanInProgess = false;
    }, t);
}

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
}

/**
 * Test if filepath is a music file.
 * Based on extensions from settings.js file
 */
Scanner.prototype.isMusicFile = function(filepath){
    var exts = settings.scanner.musicExts.split(',');
    return this.isTypeFile(filepath, exts);
}

/**
 * Test if filepath is a cover file.
 */
Scanner.prototype.isCoverFile = function(filepath){
    var exts = settings.scanner.coverExts.split(',');
    return this.isTypeFile(filepath, exts);
}

/**
 * Fetch cover with lastfm API, then create thumbnail
 */
Scanner.prototype.fetchCoverOnline = function(filepath, tag, callback){
    coverurl(settings.lastfm.api_key, tag.artist, tag.album, function(err, url) {
        if (err) {
            console.log(err);
        } else {
            if (url === null) {
                callback(null, tag);
            } else {
                http.get(url, function(res) {
                    var temppath = temp.path('festival');
                    var wstream = temp.createWriteStream(undefined, temppath);
                    res.pipe(wstream).on('close', function(){
                        callback(temppath, tag);
                    });
                });
            }
        }
    });
}

/**
 * Walk through folder defined in settings.json in order
 * to retrieve music files
 */
Scanner.prototype.scan = function(){
    var self = this;
    if (!this.scanInProgess){
        this.scanInProgess = true;
        console.log('Scan started.');
        self.db.track.find(
            {},
            function(err, docs) {
                if (err) console.error(err);
                var files = {}, albumarts = {};
                for (var i in docs) {
                    if (docs.hasOwnProperty(i)) {
                        files[docs[i].path] = docs[i].last_updated;
                    }
                }
            
                var walker = walk.walk(settings.scanner.path);

                walker.on("names", function (root, nodeNamesArray) {
                    var coverfile = null, firstmusicfile = null;
                    for (var i=0; i<nodeNamesArray.length && (coverfile === null || firstmusicfile === null); i++) {
                        var filepath = path.join(root, nodeNamesArray[i]);
                        if (coverfile === null && self.isCoverFile(filepath)) {
                            coverfile = filepath;
                        }
                        if (firstmusicfile === null && self.isMusicFile(filepath)) {
                            firstmusicfile = filepath;
                        }
                    }
                    if (firstmusicfile !== null) {
                        taglib.read(firstmusicfile, function(err2, tag, audioProperties){
                            var artist = tag.artist?tag.artist.trim().toLowerCase():null;
                            var album = tag.album?tag.album.trim().toLowerCase():null;
                            if (artist !== null && album !== null) {
                                self.db.albumart.findOne({artist: artist, album: album}, function(err3, doc){
                                    if (doc === null) { // no existing cover
                                        var mkthumbnail = function(frompath, taginfo) {
                                            if (frompath === null) {
                                                var oalbum = {artist: artist, album: album, path: null};
                                                self.db.albumart.insert(oalbum, function (err5, newDoc) {
                                                    if (err5){
                                                        console.error(err5);
                                                    } else {
                                                        if (settings.scanner.debug) {
                                                            console.log('no albumart found');
                                                        }
                                                    }
                                                });
                                            } else {
                                                thumbs.create(frompath, uuid.v4(), 140, 140, function(err4, thumbpath){
                                                    if (err4) {
                                                        console.error('Error while making thumbnail with "' + frompath + '"');
                                                        console.error(err4);
                                                    } else {
                                                        var oalbum = {artist: artist, album: album, path: thumbpath};
                                                        self.db.albumart.insert(oalbum, function (err5, newDoc) {
                                                            if (err5){
                                                                console.error(err5);
                                                            } else {
                                                                if (settings.scanner.debug) {
                                                                    console.log('album art saved : ' + thumbpath);
                                                                }
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        };
                                        if (coverfile === null) {
                                            // Fetch cover online
                                            self.fetchCoverOnline(firstmusicfile, tag, mkthumbnail);
                                        } else {
                                            // Use local cover
                                            mkthumbnail(coverfile, tag);
                                       }
                                    }
                                });
                            }
                       });
                    }
                });

                walker.on("file", function(root, fileStats, next) {
                    var filepath = path.join(root, fileStats.name);
                    if (self.isMusicFile(filepath) && (!files[filepath] || fileStats.mtime > files[filepath])){
                        if (settings.scanner.debug) {
                            console.log('Reading tags : ' + filepath);
                        }
                        delete files[filepath];
                        taglib.read(filepath, function(err, tag, audioProperties){
                            self.merge(filepath, fileStats.mtime, tag, audioProperties);
                            next();
                        });
                    }else{
                        delete files[filepath];
                        next();
                    }
                });

                walker.on("end", function () {
                    if (settings.scanner.debug) {
                        console.log('cleanold', files, albumarts);
                    }
                    self.cleanold(files, albumarts);
                    self.db.track.persistence.compactDatafile();
                    self.db.albumart.persistence.compactDatafile();
                    self.scanInProgess = false;
                    console.log('Update finished.');
                    if (self.rescanAfter) {
                        self.rescanAfter = false;
                        self.scan();
                    }
                });
            }
        );
    } else {
        self.rescanAfter = true;
    }
};

var Watcher = function(db) {
    this.scanner = new Scanner(db);
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
    watchr.watch({
        path: settings.scanner.path,
        ignoreHiddenFiles: true,
        listeners: {
            error: function(err){
                console.log('an error occured: ', err);
            },
            change: function(changeType, filePath, fileCurrentStat, filePreviousStat){
                if (settings.scanner.debug) {
                    console.log('a change event occured: ', arguments);
                }
                self.scan();
            }
        }
    });
};

module.exports = function(db) {
    return new Watcher(db);
};
