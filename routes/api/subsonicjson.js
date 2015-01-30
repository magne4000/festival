var path = require('path');
var fs = require('fs');

function SubsonicJson() {

    var API_VERSION = "1.10.1";

    SubsonicJson.SSERROR_GENERIC = 0;
    SubsonicJson.SSERROR_MISSINGPARAM = 10;
    SubsonicJson.SSERROR_APIVERSION_CLIENT = 20;
    SubsonicJson.SSERROR_APIVERSION_SERVER = 30;
    SubsonicJson.SSERROR_BADAUTH = 40;
    SubsonicJson.SSERROR_UNAUTHORIZED = 50;
    SubsonicJson.SSERROR_TRIAL = 60;
    SubsonicJson.SSERROR_DATA_NOTFOUND = 70;

    this.getArtistId = function(name){
        var ind = name.indexOf('{artist}');
        if (ind !== -1) return name.substring(ind);
        return '{artist}'+name;
    };
    this.getAlbumId = function(artist, name){return '{album}'+name+this.getArtistId(artist);};
    this.getSongId = function(name){return '{song}'+name;};
    this.isArtistId = function(name){return name.indexOf('{artist}') === 0;};
    this.isAlbumId = function(name){return name.indexOf('{album}') === 0;};
    this.isSongId = function(name){return name.indexOf('{song}') === 0;};
    this.clearId = function(name){
        if (this.isArtistId(name)) return name.split('{artist}')[1];
        if (this.isAlbumId(name)) return name.split(/\{album\}|\{artist\}/).splice(1); //[0: album, 1: artist]
        if (this.isSongId(name)) return name.split('{song}')[1];
        return name;
    };

    this.set = function(jsobj, key, value) {
        jsobj['subsonic-response'][key] = value;
    };

    this.createFailedResponse = function(version) {
        var response = this.createResponse(version);
        response['subsonic-response'].status = 'failed';
        return response;
    };

    this.createSuccessResponse = function(version) {
        var response = this.createResponse(version);
        response['subsonic-response'].status = 'ok';
        return response;
    };

    this.createResponse = function(version) {
        if (!version) version = API_VERSION;
        var obj = {
            'subsonic-response' : {
                'xmlns': 'http://subsonic.org/restapi',
                'version': version
            }
        };
        return obj;
    };

    this.createError = function(code, message) {
        var response = this.createFailedResponse();
        this.setError(response['subsonic-response'], code, message);
        return response;
    };

    this.getEmpty = function(name) {
        var response = this.createSuccessResponse();
        this.set(response, name, {});
        return response;
    };

    this.getLicense = function() {
        var response = this.createSuccessResponse();
        this.setLicense(response); 
        return response;
    };

    this.setLicense = function(jsobj) {
        this.set(jsobj, 'license', {
            valid: true,
            email: "webmaster@festival",
            key: "ABC123DEF",
            date: "2015-01-01T00:00:00"
        });
    };

    this.getMusicFolders = function() {
        var response = this.createSuccessResponse();
        this.setMusicFolders(response); 
        return response;
    };

    this.setMusicFolders = function(jsobj) {
        this.set(jsobj, 'musicFolders', {
            musicFolder: [{
                id: 1,
                name: 'Music'
            }]
        });
    };

    this.getIndexes = function(artists) {
        var response = this.createSuccessResponse();
        this.set(response, 'indexes', {
            lastModified: Date.now(),
        });
        this.addArtists(response['subsonic-response'].indexes, artists); 
        return response;
    };

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
        jsobj.index = jsobj.index.filter(function(n){ return n.artist.length > 0; });
    };

    this.addArtist = function(jsobj, artist){
        var data = {
            'id': this.getArtistId(artist.artist),
            'name': artist.artist
        };

        jsobj.artist.push(data);
    };

    this.shapeAlbum = function(elt, options) {
        options = options || {};
        var ret = {
            id: this.getAlbumId(elt.artist, elt.album),
            album: elt.album,
            year: elt.year,
            coverArt: this.getAlbumId(elt.artist, elt.album),
            artistId: this.getArtistId(elt.artist),
            artist: elt.artist,
            averageRating: 0,
            created: {
                year: elt.last_updated.getFullYear(),
                month: elt.last_updated.getMonth()+1,
                day: elt.last_updated.getDate()
            }
        };

        if (elt.duration) ret.duration = elt.duration;

        if (options.id3) {
            if (elt.songCount) ret.songCount = elt.songCount;
            ret.name = elt.album;
        }
        if (options.child) {
            ret.isDir = true;
            ret.title = elt.album + ((elt.year)?' [' + elt.year + ']':'');
            ret.parent = this.getArtistId(elt.artist);
        }
        return ret;
    };

    this.handleArtistsElements = function(jsobj, elements, options) {
        for (var x in elements) {
            var elt = elements[x];
            if (elt.artist && elt.album) {
                jsobj.push(this.shapeAlbum(elt, options));
            }
        }
    };

    this.shapeSong = function(elt) {
        var albumId = this.getAlbumId(elt.artist, elt.album);
        var ret = {
            id: this.getSongId(elt._id),
            parent: albumId,
            title: elt.name,
            isDir: false,
            isVideo: false,
            type: 'music',
            albumId: albumId,
            album: elt.album,
            artistId: this.getArtistId(elt.artist),
            artist: elt.artist,
            covertArt: albumId,
            duration: elt.duration,
            bitRate: elt.bitrate,
            track: elt.trackno,
            year: elt.year,
            genre: elt.genre,
            size: fs.statSync(elt.path).size,
            suffix: path.extname(elt.path),
            contentType: elt.mime,
            path: '' // TODO ?
        };
        return ret;
    };

    this.handleAlbumsElements = function(jsobj, elements) {
        for (var x in elements) {
            var elt = elements[x];
            if (elt.artist && elt.album) {
                jsobj.push(this.shapeSong(elt));
            }
        }
    };

    this.handleElements = function(jsobj, idparent, elements) {
        if (this.isArtistId(idparent)) {
            this.handleArtistsElements(jsobj, elements, {child: true});
        } else if (this.isAlbumId(idparent)) {
            this.handleAlbumsElements(jsobj, elements, {child: true});
        }
    };

    this.getMusicDirectory = function(id, name, elements) {
        var response = this.createSuccessResponse();
        this.set(response, 'directory', {
            id: id,
            name: name,
            child: []
        });
        this.handleElements(response['subsonic-response'].directory.child, id, elements);
        return response;
    };
    
    this.getGenres = function(genres) {
        var response = this.createSuccessResponse();
        this.set(response, 'genres', {
            genre: []
        });
        for (var x in genres) {
            var genre = genres[x];
            if (genre.genre !== null) {
                response['subsonic-response'].genres.genre.push(genre.genre);
            }
        }
        return response;
    };

    this.getArtist = function(id, albums) {
        var response = this.createSuccessResponse();
        this.set(response, 'artist', {
            id: id,
            name: this.clearId(id),
            albumCount: albums.length,
            album: []
        });
        this.handleArtistsElements(response['subsonic-response'].artist.album, albums, {id3: true});
        return response;
    };

    this.getAlbum = function(id, cid, songs) {
        var response = this.createSuccessResponse();
        var albuminfo = songs[0];
        var x;
        albuminfo.duration = 0;
        albuminfo.songCount = 0;
        for (x in songs) {
            albuminfo.duration += songs[x].duration;
            albuminfo.songCount += 1;
        }
        var albumelt = this.shapeAlbum(albuminfo, {id3: true});
        albumelt.song = [];
        for (x in songs) {
            albumelt.song.push(this.shapeSong(songs[x], id));
        }
        this.set(response, 'album', albumelt);
        return response;
    };

    this.getSong  = function(id, song) {
        var response = this.createSuccessResponse();
        this.set(response, 'song', this.shapeSong(song, this.getAlbumId(song.album, song.artist)));
        return response;
    };

    this.getAlbumList = function(albums) {
        var response = this.createSuccessResponse();
        this.set(response, 'albumList', {
            album: []
        });
        this.handleArtistsElements(response['subsonic-response'].albumList.album, albums, {child: true});
        return response;
    };

    this.getAlbumList2 = function(albums) {
        var response = this.createSuccessResponse();
        this.set(response, 'albumList2', {
            album: []
        });
        this.handleArtistsElements(response['subsonic-response'].albumList2.album, albums, {id3: true});
        return response;
    };

    this.getSongsByGenre = function(songs) {
        var response = this.createSuccessResponse();
        this.set(response, 'songsByGenre', {
            song: []
        });
        this.handleAlbumsElements(response['subsonic-response'].songsByGenre.song, songs);
        return response;
    };

    this.search = function(songs, artistCount, artistOffset, albumCount, albumOffset, options) {
        var response = this.createSuccessResponse();
        this.set(response, 'searchResult2', {
            artist: [],
            album: [],
            song: []
        });
        var artists = [];
        var albums = [];
        for (var x in songs) {
            if (songs[x].artist && artists.indexOf(songs[x].artist) === -1) {
                if (artistOffset > 0) artistOffset -= 1;
                else if (artists.length <= artistCount) {
                    artists.push(songs[x].artist);
                    response['subsonic-response'].searchResult2.artist.push({
                        id: this.getArtistId(songs[x].artist),
                        name: songs[x].artist
                    });
                }
            }
            if (songs[x].album && albums.indexOf(songs[x].album) === -1) {
                if (albumOffset > 0) albumOffset -= 1;
                else if (albums.length <= albumCount) {
                    var song = songs[x];
                    if (song.duration) delete song.duration;
                    albums.push(songs[x].album);
                    response['subsonic-response'].searchResult2.album.push(this.shapeAlbum(song, options));
                }
            }
        }
        this.handleAlbumsElements(response['subsonic-response'].searchResult2.song, songs);
        return response;
    };

    this.getRandomSongs = function(songs) {
        var response = this.createSuccessResponse();
        this.set(response, 'randomSongs', {
            song: []
        });
        this.handleAlbumsElements(response['subsonic-response'].randomSongs.song, songs);
        return response;
    };

    this.setError = function(jsobj, code, message) {
        jsobj.error = {
            code: code
        };

        if (!message) {
            switch(code) {
                case SubsonicJson.SSERROR_GENERIC:
                    message = "A generic error.";
                    break;
                case SubsonicJson.SSERROR_MISSINGPARAM:
                    message = "Required parameter is missing.";
                    break;
                case SubsonicJson.SSERROR_APIVERSION_CLIENT:
                    message = "Incompatible Subsonic REST protocol version. Client must upgrade.";
                    break;
                case SubsonicJson.SSERROR_APIVERSION_SERVER:
                    message = "Incompatible Subsonic REST protocol version. Server must upgrade.";
                    break;
                case SubsonicJson.SSERROR_BADAUTH:
                    message = "Wrong username or password.";
                    break;
                case SubsonicJson.SSERROR_UNAUTHORIZED:
                    message = "User is not authorized for the given operation.";
                    break;
                case SubsonicJson.SSERROR_TRIAL:
                    message = "The trial period for the Subsonic server is over. Please upgrade to Subsonic Premium. Visit subsonic.org for details.";
                    break;
                case SubsonicJson.SSERROR_DATA_NOTFOUND:
                    message = "The requested data was not found.";
                    break;
            }
        }

        jsobj.error.message = message;
    };
}

module.exports = SubsonicJson;
