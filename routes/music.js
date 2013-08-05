var mongoose = require('mongoose'),
	db = mongoose.connection,
	fs = require('fs'),
	settings = require('../settings.json');

exports.index = function(req, res){
	var id = req.params.id,
		Track = mongoose.model('track');
	Track.findOne({ _id : id }, function (err, track) {
		if (err) {
			console.error(err);
		} else if (track) {
			fs.exists(track.path, function(exists){
				if (exists && settings.scanner.path.indexOf(track.path) === 0){
					res.sendfile(track.path);
				}else{ 
					console.warn('Path "'+track.path+'" invalid for track '+id);
					res.send(404);
				}
			});
		} else {
			res.send(404);
		}
	});
};