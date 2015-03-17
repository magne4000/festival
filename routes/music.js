var fs = require('fs'),
    path = require('path'),
    settings = require('../settings'),
    mongoose = require('mongoose');

exports.index = function(req, res){
    var id = req.query.id?req.query.id:req.params.id,
        Track = mongoose.model('track');
    Track.findOne({ _id : id }, function (err, track) {
        if (err) {
            console.error(err);
        } else if (track) {
            fs.exists(track.path, function(exists){
                var relativepath = path.relative(settings.scanner.path, track.path);
                if (exists && relativepath.indexOf('..') !== 0){
                    res.sendFile(relativepath, {root: settings.scanner.path});
                }else{ 
                    console.warn('Path "'+track.path+'" invalid for track '+id);
                    res.sendStatus(404);
                }
            });
        } else {
            res.sendStatus(404);
        }
    });
};
