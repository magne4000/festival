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

function merge(filepath, tag, audioProperties){
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
			last_updated: Date.now()
		};
	Track.update({ path: filepath }, track, {upsert: true}, function(err, a, b){
		console.log('updated');
		clearTimeout(progressTimeout);
		progressTimeout = setTimeout(function(){
			scanInProgess = false;
		}, t);
	});
}

exports.scan = function(){
	var Track = mongoose.model('track');
	if (!scanInProgess){
		scanInProgess = true;
		//Fetch max(last_update)
		Track.aggregate(
			{$group: { _id: null, max_last_update: {$max: '$last_updated'}}},
			{$project: { _id: 0, max_last_update:1 }},
			function(err, docs) {
				var lastupdate = docs[0].max_last_update;
				walker = walk.walk(settings.scanner.path);
				walker.on("file", function(root, fileStats, next) {
					console.log(fileStats.mtime, '-', lastupdate);
					if (!lastupdate || fileStats.mtime > lastupdate){
						taglib.read(path.join(root, fileStats.name), function(err, tag, audioProperties){
							merge(path.join(root, fileStats.name), tag, audioProperties);
							next();
						});
					}
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