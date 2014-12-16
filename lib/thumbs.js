var gm = require('gm'),
    path = require('path'),
    fs = require('fs'),
    data = require('./data');

exports.create = function(imgpath, newname, maxwidth, maxheight, callback) {
    var filepath = path.join(data.getdir('thumbs'), newname+'.jpg');
    maxwidth = maxwidth || 140;
    maxheight = maxheight || 140;
    data.mkdir('thumbs');
    gm(imgpath)
    .resize(maxwidth, maxheight, '>')
    .interlace('Line')
    .write(filepath, function (err) {
        if (typeof callback === 'function') callback(err, filepath);
    });
};

