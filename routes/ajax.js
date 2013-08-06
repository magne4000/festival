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
		res.render("menu", {
			artists : ["artist 1", "artist 2"]
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
exports.listartists = function(req, res){
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
			res.json(docs);
		}
	});
};