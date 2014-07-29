var fs = require('fs'),
    settings = require('./settings'),
    thumbs = require('./lib/thumbs'),
    walk = require('walk'),
    taglib = require('taglib'),
    path = require('path'),
    watchr = require('watchr'),
    mime = require('mime'),
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
                if (err) console.log(err);
                var files = {}, albumarts = {};
                for (var i in docs) {
                    if (docs.hasOwnProperty(i)) {
                        files[docs[i].path] = docs[i].last_updated;
                    }
                }
                
                self.db.albumart.find(
                    {},
                    function(err2, docs2) {
                        if (err) console.log(err);
                        for (var i in docs2) {
                            if (docs2.hasOwnProperty(i)) {
                                albumarts[docs2[i].path] = docs2[i].dir;
                            }
                        }
                        var walker = walk.walk(settings.scanner.path);
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
                            }else if(self.isCoverFile(filepath)){
                                if (albumarts[filepath]){
                                    delete albumarts[filepath];
                                }else{
                                    var oalbum = {path: filepath, dir: root};
                                    self.db.albumart.insert(oalbum, function (err, newDoc) {
                                        if (err){
                                            console.log(err);
                                        } else {
                                            thumbs.create(filepath, newDoc._id);
                                            if (settings.scanner.debug) {
                                                console.log('album art saved : ' + filepath);
                                            }
                                        }
                                    });
                                }
                                next();
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
                                exports.scan();
                            }
                        });
                    }
                );
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
        self.scanner.scan();
    }, t);
};

/**
 * Watch folder defined in settings.json and then call scan()
 * if an event is triggered
 */
Watcher.prototype.watch = function(){
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
                exports.scan();
            }
        }
    });
};

module.exports = function(db) {
    return new Watcher(db);
};
