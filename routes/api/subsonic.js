var express = require('express'),
    subsonicjson = require('./subsonicjson')(),
    jsonix = require('./jsonix'),
    jsonixcontext = require('./jsonix-context'),
    settings = require('../../settings');

var api = function(db) {
    this.db = db;
    this.context = new jsonix.Jsonix.Context([jsonixcontext]);
};

api.prototype.preprocess = function(req, res, callback, next){
    var self = this;
    var user = req.param('u');
    var password = req.param('p');
    var version = req.param('v');
    var client = req.param('c');
    var format = req.param('f', 'xml');
    callback(req, res, function(response) {
        switch (format) {
            case 'json':
                res.json(response);
                break;
            case 'jsonp':
                res.jsonp(response);
                break;
            default:
                var marshaller = self.context.createMarshaller(); 
                var doc = marshaller.marshalString({
                    name: { localPart: "subsonic-response" },
                    value: response['subsonic-response']
                });
                res.set('Content-Type', 'text/xml');
                res.send(doc);
        }
        next();
    });
};

api.routes = {};
api.routes.ping = function(req, res, callback){
    var response = subsonicjson.createSuccessResponse();
    callback(response);
};

api.prototype.router = function() {
    var router = express.Router();
    var self = this;
    for (var x in api.routes) {
        router.use('/' + x + '.view', function(req, res, next){
            self.preprocess(req, res, api.routes[x], next);
        });
    }
    return router;
};

module.exports = function(db) {
    return new api(db);
};
