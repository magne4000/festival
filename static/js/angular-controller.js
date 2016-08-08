/* global $ */
/* global angular */
/* global buzz */
angular.module('festival')
.controller('PlayerController', ['$scope', '$tracks', '$timeout', '$desktop', function($scope, $tracks, $timeout, $desktop) {
    var indicesAlreadyPlayed = [];
    var indicesToBePlayed = [];
    var currentIndice = 0;
    var timer = null;
    var currentlyPrefetching = null;
    var progress = 0;
    var lastvolume = 100;
    var usingAdd = false;
    var sounds = {};

    $scope.currentTrack = null;
    $scope.currentSound = null;
    $scope.shuffle = false;
    $scope.loop = 0;
    $scope.buffered = 0;
    $scope.duration = 0;
    $scope.playing = false;
    $scope.volumeval = 100;
    $scope.waitingbuf = false;

    function next(bypassLoop) {
        if ($scope.currentTrack) {
            if (!bypassLoop && $scope.loop === 2) {
                return $scope.currentTrack;
            }

            if ($scope.shuffle){
                if (indicesToBePlayed.length === 0){
                    if ($scope.loop === 1) {
                        // in loop and the playlist has been finished, so reset
                        indicesToBePlayed = indicesAlreadyPlayed;
                        indicesAlreadyPlayed = [];
                    } else {
                        return null;
                    }
                }
                if (indicesToBePlayed.length > 0){
                    var randno = Math.floor(Math.random()*indicesToBePlayed.length),
                        ind = indicesToBePlayed[randno];
                    indicesAlreadyPlayed.push(ind);
                    indicesToBePlayed.splice(randno, 1);
                    currentIndice = ind;
                    return $tracks.get(ind);
                }
            }

            if (!$scope.currentTrack.next && $scope.loop === 1) {
                return $tracks.getHead();
            }

            return $scope.currentTrack.next;
        }
        return null;
    }

    function prev() {
        if ($scope.currentTrack) {
            if ($scope.shuffle){
                if (indicesAlreadyPlayed.length === 0){
                    return null;
                }
                indicesToBePlayed.push(indicesAlreadyPlayed.pop());
                currentIndice = indicesToBePlayed[indicesToBePlayed.length-1];
                return $tracks.get(currentIndice);
            }

            if ($scope.currentTrack.prev === null && $scope.loop === 1) {
                return $tracks.getTail();
            }

            return $scope.currentTrack.prev;
        }
        return null;
    }

    function stop() {
        if ($scope.currentSound) {
            /*if (!$scope.currentSound.fullyLoaded) {
                $scope.currentSound.unload();
            }*/
            $scope.currentSound.stop();
        }
    }

    function play() {
        if ($scope.currentSound) {
            $scope.currentSound.play();
        }
    }

    function attach(asound) {
        $scope.currentSound = asound;
        if (asound) {
            asound.onCompleteLoad(asound.fullyLoaded);
        }
    }

    function loadNext() {
        var nextTrack = next(true);
        if (nextTrack) {
            $scope.$apply(function(){
                $scope.load(nextTrack, false, true);  // preload next track
            });
        }
    }

    $scope.showind = function() {
        return arguments[arguments[0]+1];
    };

    $scope.play = function(track, tracks) {
        stop();
        if (!track) { // 0 param, Currently loaded track
            play();
        } else if (!tracks) { // 1 param, Load another track
            $scope.load(track, true);
        } else { // 2 params, load multiple tracks, play one of them
            $scope.add(tracks, true, track.id);
        }
    };

    $scope.next = function(autoPlay, bypassLoop) {
        var nextTrack = next(bypassLoop);
        stop();
        if (nextTrack) {
            $scope.load(nextTrack, autoPlay);
        }
    };

    $scope.prev = function(autoPlay) {
        var prevTrack = prev();
        stop();
        if (prevTrack) {
            $scope.load(prevTrack, autoPlay);
        }
    };

    $scope.add = function(track, autoPlay, idToPlay) {
        /**
         * @track can be a single track object, or a list of track objects
         * A track object is defined like this example:
         * track = {
         *      "id": "52f24b6b89e9eb1e4aed8c1c",
         *      "bitrate": 320,
         *      "duration": 86,
         *      "frequency": 44100,
         *      "trackno": 1,
         *      "year": 2013,
         *      "last_updated": "2013-04-20T14:24:46.000Z",
         *      "name": "Gift Of Tongues",
         *      "album_id": "Entities",
         *      "artist": "Pomegranate Tiger",
         *      "genre": "Instrumental Progressice Metal",
         *      "url": "/music/52f24b6b89e9eb1e4aed8c1c"
         * }
         */
        if (!usingAdd) {
            usingAdd = true;
            var tracklist = [], ind = 0, trackslen = $tracks.size(), orilen = trackslen, randno = null, loadthisone = null;
            if (!!track.id){ // only one track
                tracklist.push(track);
            } else {
                tracklist = track;
            }
            if ($scope.shuffle) {
                randno = Math.floor(Math.random()*tracklist.length);
            }
            for (ind in tracklist){
                indicesToBePlayed.push(indicesToBePlayed.length);
                var addedTrack = $tracks.add(tracklist[ind]);
                if (idToPlay === tracklist[ind].id) {
                    loadthisone = addedTrack;
                } else if (trackslen === 0 && !$scope.shuffle) {
                    // First track, load it (if not in shuffle mode)
                    loadthisone = addedTrack;
                } else if (randno === trackslen && orilen === 0 && $scope.shuffle) {
                    // load random track
                    loadthisone = addedTrack;
                }
                trackslen++;
            }
            $scope.load(loadthisone, autoPlay);
            usingAdd = false;
        }
    };

    $scope.remove = function(track) {
        if (track) {
            $tracks.remove(track);
        }
    };

    $scope.load = function(track, autoPlay, prefetch) {
        if (track){
            clearTimeout(timer);
            timer = setTimeout(function(){
                if (!prefetch) {
                    $scope.currentTrack = track;
                }
                if (autoPlay) {
                    stop();
                }
                var soundId = 't_'+track.id;
                if (currentlyPrefetching !== null && soundId != currentlyPrefetching.id) {
                    /* currentlyPrefetching.unload(); */
                    currentlyPrefetching = null;
                }
                var asound = sounds[soundId];
                if (asound) {
                    if (autoPlay) {
                        asound.play();
                    }
                } else {
                    asound = new buzz.sound(track.url, {
                        webAudioApi: false,
                        preload: true,
                        autoplay: !!autoPlay,
                        volume: $scope.volume() || 100
                    });
                    asound.id = soundId;
                    asound.bind('progress', function(){
                        var self = this;
                        
                        var buffered = this.getBuffered();
                        var duration = this.getDuration();
                        if (self.id == $scope.currentSound.id) {
                            $scope.$apply(function(){
                                if ($scope.waitingbuf && buffered.length > 0) {
                                    $scope.waitingbuf = false;
                                }
                                $scope.duration = duration;
                                $scope.buffered = buffered;
                            });
                        } else {
                            currentlyPrefetching = self;
                        }
                        if (!self.fullyLoaded && buffered.length > 0 ? parseFloat(buffered[buffered.length-1].end) >= parseFloat(duration) : false) {
                            self.fullyLoaded = true;
                            setTimeout(function() {
                                self.onCompleteLoad(true);
                            }, 0);
                        }
                    }).bind('timeupdate', function(){
                        progress = this.getTime();
                        $scope.$apply();
                    }).bind('loadstart', function(e){
                        if (this.id == $scope.currentSound.id) {
                            $scope.$apply(function(){
                                $scope.waitingbuf = true;
                            });
                        }
                    }).bind('ended', function(){
                        $scope.$apply(function(){
                            progress = 0;
                            $scope.playing = false;
                            $scope.next(true);
                        });
                    }).bind('abort', function(){
                        progress = 0;
                        $scope.$apply(function(){
                            $scope.playing = false;
                        });
                    }).bind('pause', function(){
                        $scope.$apply(function(){
                            $scope.playing = false;
                        });
                    }).bind('play', function(){
                        this.setVolume($scope.volume());
                        $desktop('Now playing', $scope.currentTrack.name + ', by ' + $scope.currentTrack.artist_name + ', on ' + $scope.currentTrack.album_name);
                    }).bind('playing', function(){
                        $scope.$apply(function(){
                            $scope.playing = true;
                        });
                    }).bind('error', function(e){
                        console.log(e, this.sound);
                    }).bind('sourceerror', function(e){
                        console.log(e);
                    });
                    asound.onCompleteLoad = function(bLoadNext) {
                        var self = this;
                        currentlyPrefetching = null;
                        if (self.id == $scope.currentSound.id) {
                            $scope.$apply(function(){
                                if (track.failed) track.failed = false;
                                $scope.duration = self.getDuration();
                                $scope.buffered = self.getBuffered();
                            });
                            if (bLoadNext) {
                                loadNext();
                            }
                        }
                    };
                    sounds[soundId] = asound;
                }
                if (!prefetch) {
                    attach(asound);
                }
            }, 10);
        }
    };

    $scope.togglePlayPause = function() {
        $timeout(function() {
            if ($scope.currentSound) {
                $scope.currentSound.togglePlay();
            }
        }, 0);
    };

    $scope.playOrPause = function(track, tracks) {
        $timeout(function() {
            if (!track || ($scope.currentTrack && $scope.currentTrack.id === track.id)) {
                $scope.currentSound.togglePlay();
            } else {
                if (tracks) {
                    $scope.empty();
                }
                $scope.play(track, tracks);
            }
        }, 0);
    };

    $scope.toggleShuffle = function() {
        $scope.shuffle = !$scope.shuffle;
        //clear already played tracks list
        indicesAlreadyPlayed = [];
    };

    $scope.circleLoop = function() {
        $scope.loop = ($scope.loop + 1) % 3;
    };

    $scope.empty = function() {
        indicesAlreadyPlayed = [];
        indicesToBePlayed = [];
        currentIndice = 0;
        $tracks.empty();
    };

    $scope.progress = function(val) {
        if (val && $scope.currentSound) {
            $timeout(function() {
                $scope.currentSound.setTime(val);
            }, 0);
        }
        return progress;
    };

    $scope.volume = function(val) {
        if (typeof val === "string") {
            val = parseInt(val, 10);
        }
        if (typeof val === "number") {
            $scope.volumeval = val;
            if ($scope.currentSound) {
                $timeout(function() {
                    buzz.setVolume(val);
                }, 0);
            }
        }
        return $scope.volumeval;
    };

    $scope.toggleVolume = function() {
        if ($scope.volumeval === 0) {
            $scope.volume(lastvolume);
        } else {
            lastvolume = $scope.volumeval;
            $scope.volume(0);
        }
    };

    $(document).on('keydown', null, 'space', function(e) {
        e.preventDefault();
        $scope.togglePlayPause();
    });
    $(document).on('keydown', null, 'left', function(e) {
        e.preventDefault();
        $scope.prev($scope.playing);
    });
    $(document).on('keydown', null, 'right', function(e) {
        e.preventDefault();
        $scope.next($scope.playing);
    });
}])
.controller('ListController', ['$scope', '$rootScope', '$ajax', '$displayMode', '$utils', '$timeout', function($scope, $rootScope, $ajax, $displayMode, $utils, $timeout) {
    $rootScope.artists = [];
    $rootScope.loading = false;

    function loadArtists(filter, params, next) {
        $rootScope.loading = true;
        $ajax.artists(filter, params).success(function(data, status) {
            $rootScope.loading = false;
            next((data.data.length > 0));
            $utils.extend($rootScope.artists, data.data);
        }).error(function(){
            $rootScope.loading = false;
            next(false);
        });
    }

    function loadAlbumsByArtists(filter, params, next) {
        $rootScope.loading = true;
        $ajax.albumsbyartists(filter, params).success(function(data, status) {
            $rootScope.loading = false;
            next((data.data.length > 0));
            $utils.extend($rootScope.artists, data.data);
        }).error(function(){
            $rootScope.loading = false;
            next(false);
        });
    }

    function loadLastAlbums(filter, params, next) {
        $rootScope.loading = true;
        $ajax.lastalbums(filter, params).success(function(data, status) {
            $rootScope.loading = false;
            next((data.data.length > 0));
            $utils.extend($rootScope.artists, data.data);
        }).error(function(){
            $rootScope.loading = false;
            next(false);
        });
    }

    $displayMode.setCallback('artists', loadArtists);
    $displayMode.setCallback('albumsbyartists', loadAlbumsByArtists);
    $displayMode.setCallback('lastalbums', loadLastAlbums);
    $displayMode.current('artists', {});

    $scope.pageArtists = function() {
        $displayMode.call();
    };

    $scope.loadAlbums = function(artist, params) {
        if (artist.albums && artist.albums.length > 0) {
            artist.expanded = !artist.expanded;
            return;
        }
        params = params || {};
        params.type = $displayMode.type();
        var filter = {
            artist: artist.id
        };
        $ajax.albumsbyartists(filter, params).success(function(data, status) {
            if (data.data.length > 0) {
                artist.expanded = true;
                artist.albums = data.data[0].albums;
            } else {
                artist.expanded = false;
            }
        });
    };

    $scope.loadAlbumsAndTracks = function(artist, flat, callback) {
        if (!artist.albums) {
            var filter = {artist: artist.id};
            var params = {
                flat: !!flat,
                type: $displayMode.type()
            };
            artist.loading = true;
            $ajax.tracks(filter, params).success(function(data, status) {
                artist.loading = false;
                artist.albums = data.data[0].albums;
                artist.expanded = (artist.albums.length > 0);
                if (typeof callback === "function") callback(artist);
            }).error(function(){
                artist.loading = false;
            });
            return true;
        } else if (typeof callback === "function") {
            $timeout(function() {
                callback(artist);
            }, 0);
        }
        return false;
    };

    $scope.loadAlbumsAndTracksAndAdd = function(artist, autoplay) {
        $scope.loadAlbumsAndTracks(artist, false, function(artist1) {
            if (artist1.albums) {
                artist1.expanded = (artist.albums.length > 0);
                for (var i=0; i<artist1.albums.length; i++) {
                    $scope.add(artist1.albums[i].tracks, autoplay);
                    autoplay = false;
                }
            }
        });
    };

    $scope.loadTracks = function(artist, album, callback) {
        if (album.tracks && album.tracks.length > 0) {
            if (typeof callback === "function") {
                $timeout(function() {
                    callback(artist, album);
                }, 0);
            }
        } else {
            var filter = {artist: artist.id, album: album.id};
            var params = {
                flat: true,
                type: $displayMode.type()
            };
            $ajax.tracks(filter, params).success(function(data, status) {
                album.tracks = data.data;
                if (typeof callback === "function") callback(artist, album);
            });
        }
    };

    $scope.loadTracksAndAdd = function(artist, album, autoplay) {
        $scope.loadTracks(artist, album, function(artist1, album1) {
            $scope.add(album1.tracks, autoplay);
        });
    };

    $scope.downloadArtist = function(artist) {
        window.location = 'download/artist/' + artist.id + '?type=' + $displayMode.type();
    };

    $scope.downloadAlbum = function(album) {
        window.location = 'download/album/' + album.id + '?type=' + $displayMode.type();
    };

    $scope.downloadTrack = function(track) {
        window.location = 'music/' + track.id + '?type=' + $displayMode.type();
    };
}])
.controller('QueueController', ['$scope', '$rootScope', '$tracks', function($scope, $rootScope, $tracks) {
    $scope.tracks = [];
    $scope.show = false;

    function computeTracks() {
        $scope.$apply(function(){
            var head = $tracks.getHead();
            var track = head;
            $scope.tracks = [];
            if (track) {
                $scope.tracks.push(track);
                while (track.next) {
                    $scope.tracks.push(track.next);
                    track = track.next;
                }
            }
        });
    }

    $rootScope.$on('tracks', computeTracks);
}])
.controller('ToolbarController', ['$scope', '$rootScope', '$ajax', '$displayMode', '$utils', '$timeout', '$location', function($scope, $rootScope, $ajax, $displayMode, $utils, $timeout, $location) {
    $scope.value = "";
    $scope.type = {text: 'Tags', value: 'tags'};
    $scope.types = [
        {
            text: 'Tags',
            value: 'tags'
        },
        {
            text: 'Folder',
            value: 'folder'
        }
    ];
    $scope.checkboxFilter = {
        artists: true,
        albums: true,
        tracks: true
    };
    $scope.displaymode = 'search';
    var promise = null;
    var lastValue = "";

    function search(term, params, next) {
        $rootScope.loading = true;
        params.flat = false;
        $ajax.search(term, $scope.checkboxFilter, params).success(function(data, status) {
            $rootScope.loading = false;
            next((data.data.length > 0));
            for (var i=0; i<data.data.length ; i++) {
                data.data[i].expanded = true;
            }
            $utils.extend($rootScope.artists, data.data);
        }).error(function(){
            $rootScope.loading = false;
            next(false);
        });
    }

    $displayMode.setCallback('search', search);

    $scope.$watch('checkboxFilter', function(newValue, oldValue) {
        if (!angular.equals(newValue, oldValue)) {
            $location.search('sar', newValue.artists);
            $location.search('sal', newValue.albums);
            $location.search('str', newValue.tracks);
            $timeout.cancel(promise);
            promise = $timeout($scope.searchnow, 700);
        }
    }, true);

    $scope.typechanged = function(type) {
        $displayMode.type(type.value);
        $timeout.cancel(promise);
        promise = $timeout(function() {
            $rootScope.artists = [];
            $displayMode.clean();
            $displayMode.call();
        }, 400);
    };

    $scope.search = function() {
        if (lastValue !== $scope.value) {
            lastValue = $scope.value;
            $timeout.cancel(promise);
            promise = $timeout($scope.searchnow, 400);
        }
    };

    $scope.searchnow = function() {
        $rootScope.artists = [];
        if ($scope.value.length > 0) {
            $displayMode.current('search', $scope.value);
        } else {
            $displayMode.current('artists', {});
        }
        $scope.displaymode = 'search';
        if ($scope.value === '') {
            $location.search('s', null);
        } else {
            $location.search('s', $scope.value);
        }
        $location.search('la', null);
        $displayMode.call();
    };

    $scope.lastalbums = function() {
        $rootScope.artists = [];
        $displayMode.current('lastalbums', {});
        $scope.displaymode = 'lastalbums';
        $scope.value = "";
        $location.search('la', 'true');
        $location.search('s', null);
        $location.search('sar', null);
        $location.search('sal', null);
        $location.search('str', null);
        $displayMode.call();
    };

    var unbind = $scope.$on('$locationChangeSuccess', function() {
        unbind();
        var triggersearchnow = true;
        var params = $location.search();
        if (typeof params.sar !== "undefined") {
            params.sar = (params.sar === true);
            if ($scope.checkboxFilter.artists !== params.sar) triggersearchnow = false;
            $scope.checkboxFilter.artists = params.sar;
        }
        if (typeof params.sal !== "undefined") {
            params.sal = (params.sal === true);
            if ($scope.checkboxFilter.albums !== params.sal) triggersearchnow = false;
            $scope.checkboxFilter.albums = params.sal;
        }
        if (typeof params.str !== "undefined") {
            params.str = (params.str === true);
            if ($scope.checkboxFilter.tracks !== params.str) triggersearchnow = false;
            $scope.checkboxFilter.tracks = params.str;
        }
        if (typeof params.s !== "undefined") {
            $scope.value = params.s;
        } else if (typeof params.la !== "undefined") {
            $scope.lastalbums();
            triggersearchnow = false;
        }
        if (triggersearchnow) {
            $scope.searchnow();
        }
    });
}]);