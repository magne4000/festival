var request = require('../lib/request');

function albumart(req, res) {
    var album = req.query.album;
    var artist = req.query.artist;
    request.albumart(artist, album, function (err, doc) {
        if (err) {
            console.error(err);
            res.sendStatus(404);
        } else {
            if (doc && doc.path !== null) {
                res.sendFile(doc.path);
            } else {
                res.sendStatus(404);
            }
        }
    });
}

module.exports = {
    albumart: albumart
};