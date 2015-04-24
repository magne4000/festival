var request = require('../lib/request');
var LRU = require("lru-cache");

var cacheSearch = LRU({
    max: 20,
    maxAge: 60000 // 1 minute
});

/**
 * JSON list of tracks
 */
function listtracks(req, res) {
    var filter = req.query.filters?JSON.parse(req.query.filters):{};
    var flat = req.query.flat?JSON.parse(req.query.flat):true;
    request.listtracks(filter, function (err, docs) {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            if (flat) {
                res.json(docs);
            } else {
                res.json(treefy(docs));
            }
        }
    });
}

function listalbumsbyartists(req, res) {
    var filter = req.query.filters?JSON.parse(req.query.filters):{};
    var skip = req.query.skip?parseInt(req.query.skip, 10):null;
    var limit = req.query.limit?parseInt(req.query.limit, 10):null;
    request.listalbumsbyartists(filter, function(err, albumsByArtists) {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            res.json(albumsByArtists);
        }
    }, skip, limit);
}

/**
 * JSON list of albums
 */
function listalbums(req, res) {
    var filter = req.query.filters?JSON.parse(req.query.filters):{};
    var skip = req.query.skip?parseInt(req.query.skip, 10):null;
    var limit = req.query.limit?parseInt(req.query.limit, 10):null;
    request.listalbums(filter, function(err, docs) {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            res.json(docs);
        }
    }, skip, limit);
}

/**
 * JSON list of artists
 */
function listartists(req, res) {
    var filter = req.query.filters?JSON.parse(req.query.filters):{};
    var skip = req.query.skip?parseInt(req.query.skip, 10):null;
    var limit = req.query.limit?parseInt(req.query.limit, 10):null;
    request.listartists(filter, function(err, docs) {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            res.json(docs);
        }
    }, skip, limit);
}

function treefy(tracks, skip, limit) {
    var tree = {};
    var ret = [];
    var nbAlbums = 0;
    var albums = [];
    var skipundef = typeof skip === "undefined";
    var limitundef = typeof limit === "undefined";
    if (!limitundef && !skipundef) {
        limit += skip;
    }
    tracks.forEach(function(element) {
        if (!element.artist) element.artist = 'Unknown';
        if (!element.album) element.album = 'Unknown';
        if (!(!skipundef && nbAlbums < skip) && !(!limitundef && nbAlbums >= limit)) {
            if (typeof tree[element.artist] === 'undefined') {
                tree[element.artist] = [];
            }
            if (typeof tree[element.artist][element.album] === 'undefined') {
                tree[element.artist][element.album] = [];
            }
            tree[element.artist][element.album].push(element);
        }
        if (albums.indexOf(element.artist+"@@@"+element.album) === -1) {
            albums.push(element.artist+"@@@"+element.album);
            nbAlbums += 1;
        }
    });
    for (var artist in tree) {
        var retArtist = {artist: artist, albums: []};
        for (var album in tree[artist]) {
            var year = null;
            if (tree[artist][album][0] && tree[artist][album][0].year) {
                year = tree[artist][album][0].year;
            }
            retArtist.albums.push({
                name: album,
                year: year,
                albumart: 'albumart?album=' + encodeURIComponent(album) + '&artist=' + encodeURIComponent(artist),
                tracks: tree[artist][album]
            });
        }
        ret.push(retArtist);
    }
    return ret;
}

function search(req, res) {
    var term = req.query.term?req.query.term:'';
    var flat = req.query.flat?JSON.parse(req.query.flat):false;
    // If flat is false, skip and limit applies to numbers of albums, not number of tracks
    var skip = req.query.skip?parseInt(req.query.skip, 10):null;
    var limit = req.query.limit?parseInt(req.query.limit, 10):null;
    var filters = req.query.filters?JSON.parse(req.query.filters):null;
    var key = term;
    if (filters) {
        key += (filters.artists)?"1":"0";
        key += (filters.albums)?"1":"0";
        key += (filters.tracks)?"1":"0";
    } else {
        key += "000";
    }
    if (cacheSearch.has(key)) {
        var docs = cacheSearch.get(key);
        if (flat) {
            res.json(docs);
        } else {
            res.json(treefy(docs, skip, limit));
        }
    } else {
        request.search(term, filters, function(err, docs) {
            if (err) {
                console.error(err);
                res.sendStatus(500);
            } else {
                cacheSearch.set(term, docs);
                if (flat) {
                    res.json(docs);
                } else {
                    res.json(treefy(docs, skip, limit));
                }
            }
        }, flat?skip:null, flat?limit:null);
    }
}

function fileinfo(req, res) {
    var ids = req.query.ids?JSON.parse(req.query.ids):null;
    if (ids !== null){
        request.fileinfo(ids.ids, function (err, tracks) {
            if (err) {
                console.error(err);
                res.sendStatus(500);
            } else if (tracks) {
                res.send(tracks);
            } else {
                res.sendStatus(500);
            }
        });
    } else {
        res.sendStatus(500);
    }
}

module.exports = {
    listtracks: listtracks,
    listalbumsbyartists: listalbumsbyartists,
    listalbums: listalbums,
    listartists: listartists,
    search: search,
    fileinfo: fileinfo
};