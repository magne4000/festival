var gm = require('gm'),
    path = require('path'),
    fs = require('fs');

exports._thumbsdir = __dirname+'/../thumbs';

function createThumbsDir() {
    if (!fs.existsSync(exports._thumbsdir)){
        fs.mkdirSync(__dirname+'/../thumbs');
    }
};

exports.create = function(imgpath, newname, maxwidth, maxheight) {
    maxwidth = maxwidth || 140;
    maxheight = maxheight || 140;
    createThumbsDir();
    gm(imgpath)
    .resize(maxwidth, maxheight, '>')
    .interlace('Line')
    .write(path.join(exports._thumbsdir, newname+'.jpg'), function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log('Thumbnail for "' + imgpath + '" written.');
        }
    });
};

exports.path = function(id) {
    var thumbpath = path.join(path.normalize(exports._thumbsdir), id+'.jpg');
    if (fs.existsSync(thumbpath)){
        return thumbpath;
    }
    return null;
};