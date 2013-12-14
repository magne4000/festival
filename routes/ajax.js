var mongoose = require('mongoose');

/**
 * Send HTML artist list
 */
exports.menu = function(req, res) {
	// TODO
	var i = req.body.i;
	if (i == 2) {
		res.send("0");
	} else {
		exports.listartists(req, res, function(list){
			res.render("menu", {
				artists: list
			});
		});
	}
};

/**
 * JSON list of tracks
 */
exports.listtracks = function(req, res){
	var filters = req.query.filters?JSON.parse(req.query.filters):{},
		Track = mongoose.model('track');
	var query = Track.find(filters);
	query.exec(function (err, docs) {
		res.json(docs);
	});
};

/**
 * JSON list of albums
 */
exports.listalbums = function(req, res){
	var filters = req.query.filters?JSON.parse(req.query.filters):{},
		Track = mongoose.model('track');
	Track.aggregate(
	{$match: filters},
	{$group: {_id: {album: '$album'}, year: {$first: '$year'}, artist: {$first: '$artist'}}},
	{$project: {_id: 0, artist: 1, year: 1, album: '$_id.album'}},
	function(err, docs) {
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
exports.listartists = function(req, res, callback){
	var filters = req.query.filters?JSON.parse(req.query.filters):{},
		Track = mongoose.model('track');
	Track.aggregate(
	{$match: filters},
	{$group: {_id: {artist: '$artist'}}},
	{$project: {_id: 0, artist: '$_id.artist'}},
	function(err, docs) {
		if (err){
			console.error(err);
		}else{
			if (callback){
				callback(docs);
			}else{
				res.json(docs);
			}
		}
	});
};

exports.fileinfo = function(req, res){
	var id = req.query.id?req.query.id:null,
		ids = req.query.ids?JSON.parse(req.query.ids):null,
		Track = mongoose.model('track');
	console.log(id);
	console.log(ids);
	if (id !== null){
		Track.findOne({ _id : id }, function (err, track) {
			if (err) {
				console.error(err);
			} else if (track) {
				res.send(track);
			} else {
				res.send(500);
			}
		});
	}else if (ids !== null){
		Track.find({ _id : {$in: ids.ids}}, function (err, tracks) {
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