var fs = require('fs'),
	settings = require('./settings.json'),
	walk = require('walk'),
	taglib = require('taglib'),
	path = require('path'),
	mongoose = require('mongoose'),
	scanTimeout = null,
	progressTimeout = null,
	scanInProgess = false,
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
	console.log(tag);
	var track = {
			path: filepath,
			genre: tag.genre,
			album: tag.album,
			artist: tag.artist,
			name: tag.title,
			duration: audioProperties.length,
			year: tag.year,
			bitrate: audioProperties.bitrate,
			frequency: audioProperties.sampleRate,
			trackno: tag.track,
			last_updated: mtime
		};
	Track.update({ path: filepath }, track, {upsert: true}, function(err, a, b){
		console.log('updated');
		clearProgressTimeout();
	});
}

/**
 * Delete files that are not on the filesystem anymore
 * @param files
 */
function cleanold(files){
	var Track = mongoose.model('track'),
		filesToDelete = [];
	Object.keys(files).forEach(function(element) {
		filesToDelete.push(element);
	});
	Track.remove({path: {$in: filesToDelete}}).exec();
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
 * Walk through folder defined in settings.json in order
 * to retrieve music files
 */
exports.scan = function(){
	var Track = mongoose.model('track');
	if (!scanInProgess){
		scanInProgess = true;
		Track.find(
			{},
			"path last_updated",
			function(err, docs) {
				var files = {};
				for (var i in docs) {
					if (docs.hasOwnProperty(i)) {
						files[docs[i].path] = docs[i].last_updated;
					}
				}
				walker = walk.walk(settings.scanner.path);
				walker.on("file", function(root, fileStats, next) {
					var filepath = path.join(root, fileStats.name);
					delete files[filepath];
					if (!files[filepath] || fileStats.mtime > files[filepath]){
						taglib.read(filepath, function(err, tag, audioProperties){
							merge(filepath, fileStats.mtime, tag, audioProperties);
							next();
						});
					}else{
						next();
					}
				});
				
				walker.on("end", function () {
					console.log('cleanold', files);
					cleanold(files);
				});
			}
		);
	}
};

/**
 * Watch folder defined in settings.json and then call scan()
 * if an event is triggered
 */
exports.watch = function(){
	fs.watch(settings.scanner.path, function(event, filename){
		console.log("File " + filename + "; event " + event);
		clearTimeout(scanTimeout);
		scanTimeout = setTimeout(exports.scan, t);
	});
};