var querystring = require('querystring');
var http = require('http');

module.exports = function(api_key, artist, album, callback) {

    var searchurl = "http://ws.audioscrobbler.com/2.0/?";

    var params = {
        format: 'json',
        method: 'album.getInfo',
        api_key: api_key,
        artist: artist,
        album: album
    };

    var url = searchurl + querystring.stringify(params);

    function large(jsonobj) {
        for (var i=0; i<jsonobj.album.image.length; i++) {
            if (jsonobj.album.image[i].size == 'large'){
                return (jsonobj.album.image[i]['#text'] === '')?null:jsonobj.album.image[i]['#text'];
            }
        }
        return null;
    }

    http.get(url, function(res) {

        var data = '';
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            data += chunk;
        });

        res.on('end', function() {
            try {
                callback(null, large(JSON.parse(data)));
            } catch (e) {
                callback(e);
            }
        });
    }).on('error', function(e) {
        console.log("Error in coverurl", url);
        callback(e);
    });
};
