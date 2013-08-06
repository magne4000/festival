var fs = require('fs'),
	settings = require('./settings.json'),
	walk = require('walk'),
	taglib = require('taglib'),
	path = require('path'),
	mongoose = require('mongoose'),
	scanTimeout = null,
	progressTimeout = null,
	scanInProgess = false,
	t = 1000;

function merge(filepath, mtime, tag, audioProperties){
	var Track = mongoose.model('track');
	var track = {
			path: filepath,
			genre: tag.genre,
			album: tag.album,
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

function cleanold(files){
	var Track = mongoose.model('track'),
		filesToDelete = [];
	Object.keys(files).forEach(function(element) {
		filesToDelete.push(element);
	});
	Track.remove({path: {$in: filesToDelete}}).exec();
	clearProgressTimeout();
}

function clearProgressTimeout(){
	clearTimeout(progressTimeout);
	progressTimeout = setTimeout(function(){
		scanInProgess = false;
	}, t);
}

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

exports.watch = function(){
	fs.watch(settings.scanner.path, function(event, filename){
		console.log("File " + filename + "; event " + event);
		clearTimeout(scanTimeout);
		scanTimeout = setTimeout(exports.scan, t);
	});
};