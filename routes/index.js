/*
 * GET home page.
 */
var mongoose = require('mongoose'),
	db = mongoose.connection,
	settings = require('../settings.json');

exports.index = function(req, res) {
	res.render('index', {
		title : 'Webmusic',
		soundmanager: settings.soundmanager,
		debug: settings.debug
	});
};