/*
 * GET home page.
 */
var settings = require('../settings'),
    ajax = require('./ajax');

exports.index = function(req, res) {
    ajax.listartists(req, res, function(docs){
        res.render('index', {
            title : 'Festival',
            soundmanager: settings.soundmanager,
            debug: settings.debug,
            artists: docs
        });
    });
};
