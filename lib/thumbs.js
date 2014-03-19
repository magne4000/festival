var gm = require('gm'),
    path = require('path'),
    fs = require('fs'),
    data = require('./data');

exports.create = function(imgpath, newname, maxwidth, maxheight) {
    maxwidth = maxwidth || 140;
    maxheight = maxheight || 140;
    data.mkdir('thumbs');
    gm(imgpath)
    .resize(maxwidth, maxheight, '>')
    .interlace('Line')
    .write(path.join(data.getdir('thumbs'), newname+'.jpg'), function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log('Thumbnail for "' + imgpath + '" written.');
        }
    });
};

exports.path = function(id) {
    var thumbpath = path.join(data.getdir('thumbs'), id+'.jpg');
    if (fs.existsSync(thumbpath)) {
        return thumbpath;
    }
    return null;
};

exports.remove = function(id) {
    var thpath = exports.path(id);
    if (thpath !== null) {
        fs.unlinkSync(thpath);
        return true;
    }
    return false;
};
