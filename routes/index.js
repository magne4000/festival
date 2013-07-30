/*
 * GET home page.
 */

exports.index = function(req, res) {
	res.render('index', {
		title : 'Express'
	});

	var mongoose = require('mongoose');
	var Kitten = mongoose.model('Kitten');
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	var silence = new Kitten({
		name : 'Silence'
	});
	silence.save();
	Kitten.find(function(err, kittens) {
		console.log(kittens);
	});
};