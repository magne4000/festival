var path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp');

exports.dir = path.normalize(path.join(__dirname, '..', 'data'));

exports.mkdir = function(name) {
    var newdir = exports.getdir(name);
    if (newdir !== false) {
        if (!fs.existsSync(newdir)){
            mkdirp.sync(newdir, 0770);
            return true;
        }
    }
    return false;
};

exports.getdir = function(name) {
    if (name.indexOf(path.sep) >= 0) return false;
    return path.join(exports.dir, name);
};