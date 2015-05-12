var mongoose = require('mongoose');

//https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function listartists(filter, callback, skip, limit){
    var Track = mongoose.model('track');
    var stages = [
        {$match: filter},
        {$group: {_id: {artist: '$artist'}}},
        {$project: {_id: 0, artist: '$_id.artist'}},
        {$sort: {artist: 1}}
    ];
    if (skip) stages.push({$skip: skip});
    if (limit) stages.push({$limit: limit});
    Track.aggregate(
        stages,
        callback
    );
}

function listgenres(filter, callback, skip, limit){
    var Track = mongoose.model('track');
    var stages = [
        {$match: filter},
        {$group: {_id: {genre: '$genre'}}},
        {$project: {_id: 0, genre: '$_id.genre'}},
        {$sort: {genre: 1}}
    ];
    if (skip) stages.push({$skip: skip});
    if (limit) stages.push({$limit: limit});
    Track.aggregate(
        stages,
        callback
    );
}

function listalbums(filter, callback, skip, limit){
    var Track = mongoose.model('track');
    var stages = [
        {$match: filter},
        {$group: {_id: {artist: '$artist', album: '$album'}, year: {$first: '$year'}, artist: {$first: '$artist'}}},
        {$sort: {artist: 1, year: -1, album: 1}},
        {$project: {_id: 0, artist: 1, year: 1, album: '$_id.album'}}
    ];
    if (skip) stages.push({$skip: skip});
    if (limit) stages.push({$limit: limit});
    Track.aggregate(
        stages,
        callback
    );
}

/**
 * JSON list of albums by artists.
 * e.g.
 *   [{
 *     artist: "artist1 name",
 *     albums: [
 *       {album: "album1 name", albumart: "http://mydomain.com/album1/art"},
 *       {album: "album2 name"},
 *     ]
 *   }, ...]
 */
function listalbumsbyartists(filter, callback, skip, limit){
    var albumsByArtists = [],
        lastArtist = null,
        Track = mongoose.model('track');
        
    var stages = [
        {$match: filter},
        {$group: {_id: {artist: '$artist', album: '$album'}, year: {$first: '$year'}, artist: {$first: '$artist'}, first_path: {$first: '$path'}}},
        {$sort: {artist: 1, year: -1, album: 1}},
        {$project: {_id: 0, artist: 1, year: 1, album: '$_id.album'}}
    ];
    if (skip) stages.push({$skip: skip});
    if (limit) stages.push({$limit: limit});

    // Fetch tracks info
    Track.aggregate(
        stages,
        function(err, docs) {
            if (err){
                callback(err, null);
            } else {
                for (var i=0; i<docs.length; i++){
                    var album = {name: docs[i].album, year: docs[i].year},
                        artist = docs[i].artist;
                    album.albumart = 'albumart?album=' + encodeURIComponent(docs[i].album) + '&artist=' + encodeURIComponent(docs[i].artist);
                    if (artist !== null){
                        if (lastArtist !== artist){
                            // add artist with first album
                            albumsByArtists.push({artist: artist, albums: [album]});
                            lastArtist = artist;
                        } else {
                            // artist already exists, so only add album to it
                            albumsByArtists[albumsByArtists.length-1].albums.push(album);
                        }
                    }
                }
                callback(null, albumsByArtists);
            }
        }
    );
}

function listtracks(filter, callback, skip, limit) {
    var Track = mongoose.model('track');
    var query = Track.find(filter).sort({ artist: 1, year: -1, album: 1, trackno: 1 });
    if (skip) query.skip(skip);
    if (limit) query.limit(limit);
    query.exec(callback);
}

function fileinfo(ids, callback) {
    listtracks({ _id : {$in: ids}}, callback);
}

function searchartists(term, callback, skip, limit) {
    term = escapeRegExp(term);
    var filter = {artist : {$regex: new RegExp(term, 'i')}};
    listartists(filter, callback, skip, limit);
}

function searchalbums(term, callback, skip, limit) {
    term = escapeRegExp(term);
    var filter = {album : {$regex: new RegExp(term, 'i')}};
    listalbums(filter, callback, skip, limit);
}

function search(term, filters, callback, skip, limit) {
    if (filters) {
        term = escapeRegExp(term);
        var filter = {
            $or: []
        };
        if (filters) {
            if (filters.artists) {
                filter.$or.push({artist : {$regex: new RegExp(term, 'i')}});
            }
            if (filters.albums) {
                filter.$or.push({album : {$regex: new RegExp(term, 'i')}});
            }
            if (filters.tracks) {
                filter.$or.push({name : {$regex: new RegExp(term, 'i')}});
            }
        }
        listtracks(filter, callback, skip, limit);
    } else {
        callback("No filter specified", []);
    }
}

function albumart(artist, album, callback){
    var Albumart = mongoose.model('albumart');
    var query = Albumart.findOne({album: album, artist: artist});
    query.exec(callback);
}

module.exports = {
    listartists: listartists,
    listgenres: listgenres,
    listalbums: listalbums,
    listalbumsbyartists: listalbumsbyartists,
    listtracks: listtracks,
    fileinfo: fileinfo,
    searchartists: searchartists,
    searchalbums: searchalbums,
    search: search,
    albumart: albumart
};