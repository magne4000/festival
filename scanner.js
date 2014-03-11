var fs = require('fs'),
    settings = require('./settings'),
    thumbs = require('./lib/thumbs'),
    walk = require('walk'),
    taglib = require('taglib'),
    path = require('path'),
    mongoose = require('mongoose'),
    scanTimeout = null,
    progressTimeout = null,
    scanInProgess = false,
    rescanAfter = false,
    t = 10000;

/**
 * Add or update track to database
 * @param filepath
 * @param mtime
 * @param tag
 * @param audioProperties
 */
function merge(filepath, mtime, tag, audioProperties){
    var Track = mongoose.model('track');
    var track = {
        path: filepath,
        last_updated: mtime
    };
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
    Track.update({ path: filepath }, track, {upsert: true}, function(err, a, b){
        console.log(filepath + ' : updated');
        clearProgressTimeout();
    });
}

/**
 * Delete files that are not on the filesystem anymore
 * @param files
 */
function cleanold(files, albumarts){
    var Track = mongoose.model('track'),
        Albumart = mongoose.model('albumart'),
        albumartsToDelete = [],
        filesToDelete = [];
    
    // Clean old tracks
    Object.keys(files).forEach(function(element) {
        filesToDelete.push(element);
    });
    Track.remove({path: {$in: filesToDelete}}).exec();
    
    // Clean old covers
    Object.keys(albumarts).forEach(function(element) {
        albumartsToDelete.push(element);
    });
    Albumart.remove({path: {$in: albumartsToDelete}}).exec();
    
    clearProgressTimeout();
}

/**
 * Update the scanInProgess boolean
 */
function clearProgressTimeout(){
    clearTimeout(progressTimeout);
    progressTimeout = setTimeout(function(){
        scanInProgess = false;
    }, t);
}

/**
 * Test if filepath is a music file.
 * Based on extensions from settings.js file
 */
function isMusicFile(filepath){
    var exts = settings.scanner.exts.split(','),
        fileext = path.extname(filepath);
    for (var key in exts){
        if (exts[key].trim().toLowerCase() === fileext){
            return true;
        }
    }
    return false;
}

/**
 * Test if filepath is a cover file.
 */
function isCoverFile(filepath){
    var exts = ['.png', '.jpg', '.jpeg', '.gif'],
        fileext = path.extname(filepath);
    for (var key in exts){
        if (exts[key].trim().toLowerCase() === fileext){
            return true;
        }
    }
    return false;
}

/**
 * Walk through folder defined in settings.json in order
 * to retrieve music files
 */
var scan = function(){
    var Track = mongoose.model('track'),
        Albumart = mongoose.model('albumart');
    if (!scanInProgess){
        scanInProgess = true;
        Track.find(
            {},
            "path last_updated",
            function(err, docs) {
                var files = {}, albumarts = {};
                for (var i in docs) {
                    if (docs.hasOwnProperty(i)) {
                        files[docs[i].path] = docs[i].last_updated;
                    }
                }
                
                Albumart.find(
                    {},
                    "path dir",
                    function(err2, docs2) {
                        for (var i in docs2) {
                            if (docs2.hasOwnProperty(i)) {
                                albumarts[docs2[i].path] = docs2[i].dir;
                            }
                        }
                        var walker = walk.walk(settings.scanner.path);
                        walker.on("file", function(root, fileStats, next) {
                            var filepath = path.join(root, fileStats.name);
                            if (isMusicFile(filepath) && (!files[filepath] || fileStats.mtime > files[filepath])){
                                if (settings.scanner.debug) {
                                    console.log('Reading tags : ' + filepath);
                                }
                                delete files[filepath];
                                taglib.read(filepath, function(err, tag, audioProperties){
                                    merge(filepath, fileStats.mtime, tag, audioProperties);
                                    next();
                                });
                            }else if(isCoverFile(filepath)){
                                if (albumarts[filepath]){
                                    delete albumarts[filepath];
                                }else{
                                    var oalbum = new Albumart({path: filepath, dir: root});
                                    oalbum.save(function (err) {
                                        if (err){
                                            console.log(err);
                                        } else {
                                            Albumart.findById(oalbum, function (err, doc) {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    thumbs.create(filepath, doc._id);
                                                    if (settings.scanner.debug) {
                                                        console.log('album art saved : ' + filepath);
                                                    }
                                                }
                                            });
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
                            cleanold(files, albumarts);
                            scanInProgess = false;
                            console.log('Update finished.');
                            if (rescanAfter) {
                                rescanAfter = false;
                                exports.scan();
                            }
                        });
                    }
                );
            }
        );
    } else {
        rescanAfter = true;
    }
};

/**
 * Launch scan after t milliseconds
 */
exports.scan = function(){
    clearTimeout(scanTimeout);
    scanTimeout = setTimeout(scan, t);
};

/**
 * Watch folder defined in settings.json and then call scan()
 * if an event is triggered
 */
exports.watch = function(){
    fs.watch(settings.scanner.path, function(event, filename){
        console.log("File " + filename + "; event " + event);
        exports.scan();
    });
};
