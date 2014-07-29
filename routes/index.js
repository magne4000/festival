/*
 * GET home page.
 */
var settings = require('../settings');

var index = function(db) {
    this.ajax = require('./ajax')(db);
};

index.prototype.index = function(req, res) {
    this.ajax.listartists(req, res, function(docs){
        res.render('index', {
            title : 'Festival',
            soundmanager: settings.soundmanager,
            debug: settings.debug,
            artists: docs
        });
    });
};

module.exports = function(db) {
    return new index(db);
};
