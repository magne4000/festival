
function SubsonicJson() {

    var API_VERSION = "1.10.2";

    var SSERROR_GENERIC = 0;
    var SSERROR_MISSINGPARAM = 10;
    var SSERROR_APIVERSION_CLIENT = 20;
    var SSERROR_APIVERSION_SERVER = 30;
    var SSERROR_BADAUTH = 40;
    var SSERROR_UNAUTHORIZED = 50;
    var SSERROR_TRIAL = 60;
    var SSERROR_DATA_NOTFOUND = 70;

    var AMPACHEID_ARTIST = 100000000;
    var AMPACHEID_ALBUM = 200000000;
    var AMPACHEID_SONG = 300000000;
    var AMPACHEID_SMARTPL = 400000000;
    var AMPACHEID_VIDEO = 500000000;

    this.set = function(jsobj, key, value) {
        jsobj['subsonic-response'][key] = value;
    };

    this.createFailedResponse = function(version) {
        var response = this.createResponse(version);
        response['subsobic-response'].status = 'failed';
        return response;
    }

    this.createSuccessResponse = function(version) {
        var response = this.createResponse(version);
        response['subsonic-response'].status = 'ok';
        return response;
    }

    this.createResponse = function(version) {
        if (!version) version = API_VERSION;
        var obj = {
            'subsonic-response' : {
                'xmlns': 'http://subsonic.org/restapi',
                'version': version
            }
        };
        return obj;
    }

    this.createError = function(code, message) {
        if (!version) version = API_VERSION;
        var response = this.createFailedResponse(version);
        this.setError(response, code, message);
        return response;
    }

    this.getLicense = function() {
        var response = this.createSuccessResponse();
        this.setLicense(response); 
        return response;
    }

    this.setLicense = function(jsobj) {
        this.set(jsobj, 'license', {
            valid: true,
            email: "webmaster@festival",
            key: "ABC123DEF",
            date: "2015-01-01T00:00:00"
        });
    }

    this.getMusicFolders = function() {
        var response = this.createSuccessResponse();
        this.setMusicFolders(response); 
        return response;
    }

    this.setMusicFolders = function(jsobj) {
        this.set(jsobj, 'musicFolders', {
            musicFolder: [{
                id: 1,
                name: 'Music'
            }]
        });
    }

    this.getIndexes = function(artists) {
        var response = this.createSuccessResponse();
        this.set(response, 'indexes', {
            lastModified: Date.now(),
        })
        this.addArtists(response['subsonic-response'].indexes, artists); 
        return response;
    }

    this.addArtists = function(jsobj, artists) {
        var indices = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X-Z'];
        if (!jsobj['index']) {
            jsobj.index = [];
            for (var ind in indices) {
                jsobj.index.push({
                    name: indices[ind],
                    artist: []
                });
            }
        }
        for (var artistVal in artists) {
            var artist = artists[artistVal];
            if (artist.artist && artist.artist.length > 0) {
                var letter = artist.artist.toUpperCase();
                if (letter == "X" || letter == "Y" || letter == "Z") letter = "X-Z";
                else if (!letter.match(/^[A-W]$/)) letter = "#";

                this.addArtist(jsobj.index[indices.indexOf(letter)], artist);
            }
        }
        jsobj.index = jsobj.index.filter(function(n){ return n.artist.length > 0 });
    }

    this.addArtist = function(jsobj, artist){
        var data = {
            'id': artist.artist,
            'name': artist.artist
        };

        jsobj.artist.push(data);
    }

    this.setError = function(jsobj, code, message) {
        jsobj.error = {
            code: code
        };

        if (!message) {
            switch(code) {
                case SSERROR_GENERIC:
                    message = "A generic error.";
                    break;
                case SSERROR_MISSINGPARAM:
                    message = "Required parameter is missing.";
                    break;
                case SSERROR_APIVERSION_CLIENT:
                    message = "Incompatible Subsonic REST protocol version. Client must upgrade.";
                    break;
                case SSERROR_APIVERSION_SERVER:
                    message = "Incompatible Subsonic REST protocol version. Server must upgrade.";
                    break;
                case SSERROR_BADAUTH:
                    message = "Wrong username or password.";
                    break;
                case SSERROR_UNAUTHORIZED:
                    message = "User is not authorized for the given operation.";
                    break;
                case SSERROR_TRIAL:
                    message = "The trial period for the Subsonic server is over. Please upgrade to Subsonic Premium. Visit subsonic.org for details.";
                    break;
                case SSERROR_DATA_NOTFOUND:
                    message = "The requested data was not found.";
                    break;
            }
        }

        jsobj.error.message = message;
    }
}

module.exports = function() { return new SubsonicJson; };
