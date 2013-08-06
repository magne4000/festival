/*
 * GET home page.
 */
var settings = require('../settings.json');

exports.index = function(req, res) {
	res.render('index', {
		title : 'Webmusic',
		soundmanager: settings.soundmanager,
		debug: settings.debug
	});
};