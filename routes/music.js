var fs = require('fs'),
    path = require('path'),
    settings = require('../settings');

var music = function(db) {
    this.db = db;
};

music.prototype.index = function(req, res){
    var id = req.params.id;
    this.db.track.findOne({ _id : id }, function (err, track) {
        if (err) {
            console.error(err);
        } else if (track) {
            fs.exists(track.path, function(exists){
                var relativepath = path.relative(settings.scanner.path, track.path);
                if (exists && relativepath.indexOf('..') !== 0){
                    res.sendFile(relativepath, {root: settings.scanner.path});
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

module.exports = function(db) {
    return new music(db);
};
