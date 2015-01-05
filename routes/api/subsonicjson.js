
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
