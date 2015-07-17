/*
 * GET home page.
 */
var settings = require('../lib/settings')();

exports.index = function(req, res) {
    res.render('index', {
        title : 'Festival',
        soundmanager: settings.soundmanager,
        debug: settings.debug
    });
};
