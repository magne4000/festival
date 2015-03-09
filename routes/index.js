/*
 * GET home page.
 */
var settings = require('../settings'),
    request = require('../lib/request');

exports.index = function(req, res) {
    res.render('index', {
        title : 'Festival',
        soundmanager: settings.soundmanager,
        debug: settings.debug
    });
};
