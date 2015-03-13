angular.module('festival')
.controller('PlayerController', ['$scope', '$tracks', '$timeout', function($scope, $tracks, $timeout) {
    var indicesAlreadyPlayed = [];
    var indicesToBePlayed = [];
    var currentIndice = 0;
    var timer = null;
    var progress = 0;
    var usingAdd = false;
    
    $scope.currentTrack = null;
    $scope.currentSound = null;
    $scope.shuffle = false;
    $scope.loop = false;
    $scope.volume = 100;
    $scope.buffered = 0;
    $scope.duration = 0;
    $scope.playing = false;
    
    function next() {
        if ($scope.currentTrack) {
            if ($scope.shuffle){
                if (indicesToBePlayed.length === 0){
                    if ($scope.loop) {
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
            
            if (!$scope.currentTrack.next && $scope.loop) {
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
            
            if ($scope.currentTrack.prev === null && $scope.loop) {
                return $tracks.getTail();
            }
            
            return $scope.currentTrack.prev;
        }
        return null;
    }
    
    function stop() {
        if ($scope.currentSound) {
            $scope.currentSound.unload();
            $scope.currentSound.stop();
        }
    }
    
    function play() {
        if ($scope.currentSound) {
            $scope.currentSound.play();
        }
    }
    
    $scope.play = function(track, tracks) {
        stop();
        if (!track) { // 0 param, Currently loaded track
            play();
        } else if (!tracks) { // 1 param, Load another track
            $scope.load(track, true);
        } else { // 2 params, load multiple tracks, play one of them
            $scope.add(tracks, true, track._id);
        }
    };
    
    $scope.next = function(autoPlay) {
        var nextTrack = next();
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
         *      "_id": "52f24b6b89e9eb1e4aed8c1c",
         *      "bitrate": 320,
         *      "duration": 86,
         *      "frequency": 44100,
         *      "trackno": 1,
         *      "year": 2013,
         *      "last_updated": "2013-04-20T14:24:46.000Z",
         *      "name": "Gift Of Tongues",
         *      "album": "Entities",
         *      "artist": "Pomegranate Tiger",
         *      "genre": "Instrumental Progressice Metal",
         *      "url": "/music/52f24b6b89e9eb1e4aed8c1c"
         * }
         */
        if (!usingAdd) {
            usingAdd = true;
            var tracklist = [], ind = 0, trackslen = $tracks.size(), orilen = trackslen, randno = null;
            if (!!track._id){ // only one track
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
                if (idToPlay === tracklist[ind]._id) {
                    $scope.load(addedTrack, autoPlay);
                } else if (trackslen === 0 && !$scope.shuffle) {
                    // First track, load it (if not in shuffle mode)
                    $scope.load(addedTrack, autoPlay);
                } else if (randno === trackslen && orilen === 0 && $scope.shuffle) {
                    // load random track
                    $scope.load(addedTrack, autoPlay);
                }
                trackslen++;
            }
            usingAdd = false;
        }
    };
    
    $scope.remove = function(track) {
        if (track) {
            $tracks.remove(track);
        }
    };
    
    $scope.load = function(track, autoPlay) {
        if (track){
            clearTimeout(timer);
            timer = setTimeout(function(){
                $scope.currentTrack = track;
                if (autoPlay) {
                    stop();
                }
                var soundId = 't_'+track._id;
                $scope.currentSound = soundManager.getSoundById(soundId);
                if ($scope.currentSound) {
                    if (autoPlay) {
                        $scope.currentSound.play();
                    }
                } else {
                    $scope.currentSound = soundManager.createSound({
                        id: soundId,
                        url: track.url,
                        type: track.mime,
                        autoLoad: true,
                        autoPlay: !!autoPlay,
                        whileplaying: function(){
                            var self = this;
                            $scope.$apply(function(){
                                progress = self.position / 1000;
                            });
                        },
                        whileloading: function(){
                            var self = this;
                            $scope.$apply(function(){
                                $scope.duration = Math.floor(self.durationEstimate / 1000);
                                $scope.buffered = self.buffered;
                            });
                        },
                        onfinish: function(){
                            $scope.$apply(function(){
                                progress = 0;
                                $scope.playing = false;
                                $scope.next(true);
                            });
                        },
                        onstop: function(){
                            $scope.$apply(function(){
                                progress = 0;
                                $scope.playing = false;
                            });
                        },
                        onpause: function(){
                            $scope.$apply(function(){
                                $scope.playing = false;
                            });
                        },
                        onplay: function(){
                            $scope.$apply(function(){
                                $scope.playing = true;
                            });
                        },
                        onload: function(){
                            var self = this;
                            $scope.$apply(function(){
                                $scope.duration = Math.floor(self.duration / 1000);
                                $scope.buffered = self.buffered;
                            });
                        },
                        onresume: function(){
                            $scope.$apply(function(){
                                $scope.playing = true;
                            });
                        },
                        volume: $scope.volume || 100
                    });
                }
            }, 10);
        }
    };
    
    $scope.togglePlayPause = function() {
        $timeout(function() {
            if (!!$scope.currentSound) {
                $scope.currentSound.togglePause();
            }
        }, 0);
    };
    
    $scope.setVolume = function(vol) {
        if (!!$scope.currentSound) {
            $timeout(function() {
                $scope.currentSound.setVolume(vol);
            }, 0);
        }
        $scope.volume = vol;
    };
    
    $scope.toggleShuffle = function() {
        $scope.shuffle = !$scope.shuffle;
        //clear already played tracks list
        indicesAlreadyPlayed = [];
    };
    
    $scope.toggleLoop = function() {
        $scope.loop = !$scope.loop;
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
                $scope.currentSound.setPosition(val * 1000);
            }, 0);
        }
        return progress;
    };
}])
.controller('ListController', ['$scope', '$rootScope', '$ajax', '$displayMode', '$utils', '$timeout', function($scope, $rootScope, $ajax, $displayMode, $utils, $timeout) {
    $rootScope.artists = [];
    
    function loadArtists(filter, skip, limit, next) {
        $ajax.artists(filter, skip, limit).success(function(data, status) {
            next((data.length > 0));
            $utils.extend($rootScope.artists, data);
        }).error(function(){
            next(false);
        });
    }
    
    function loadAlbumsByArtists(filter, skip, limit, next) {
        $ajax.albumsbyartists(filter, skip, limit).success(function(data, status) {
            next((data.length > 0));
            $utils.extend($rootScope.artists, data);
        }).error(function(){
            next(false);
        });
    }
    
    $displayMode.setCallback('artists', loadArtists);
    $displayMode.setCallback('albumsbyartists', loadAlbumsByArtists);
    $displayMode.current('artists', {});
    
    $scope.pageArtists = function() {
        $displayMode.call();
    };
    
    $scope.loadAlbums = function(artist) {
        if (artist.albums && artist.albums.length > 0) return;
        var filter = {artist: artist.artist};
        $ajax.albumsbyartists(filter).success(function(data, status) {
            if (data.length > 0) {
                artist.albums = data[0].albums;
            }
        });
    };
    
    $scope.loadAlbumsAndTracks = function(artist, callback) {
        if (!artist.everythingLoaded) {
            var filter = {artist: artist.artist};
            $ajax.tracks(filter, false).success(function(data, status) {
                artist.albums = data[0].albums;
                artist.everythingLoaded = true;
                if (typeof callback === "function") callback(artist);
            });
        } else {
            $timeout(function() {
                callback(artist);
            }, 0);
        }
    };
    
    $scope.loadAlbumsAndTracksAndAdd = function(artist, autoplay) {
        $scope.loadAlbumsAndTracks(artist, function(artist1) {
            if (artist1.albums) {
                for (var i=0; i<artist1.albums.length; i++) {
                    $scope.add(artist1.albums[i].tracks, autoplay);
                    autoplay = false;
                }
            }
        });
    };
    
    $scope.loadTracks = function(artist, album, callback) {
        if (album.tracks && album.tracks.length > 0) {
            $timeout(function() {
                callback(artist, album);
            }, 0);
        } else {
            var filter = {artist: artist.artist, album: album.name};
            $ajax.tracks(filter, true).success(function(data, status) {
                album.tracks = data;
                if (typeof callback === "function") callback(artist, album);
            });
        }
    };
    
    $scope.loadTracksAndAdd = function(artist, album, autoplay) {
        $scope.loadTracks(artist, album, function(artist1, album1) {
            $scope.add(album1.tracks, autoplay);
        });
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
.controller('ToolbarController', ['$scope', '$rootScope', '$ajax', '$displayMode', '$utils', function($scope, $rootScope, $ajax, $displayMode, $utils) {
    $scope.value = "";
    
    function search(param, skip, limit, next) {
        $ajax.search(param, false, skip, limit).success(function(data, status) {
            next((data.length > 0));
            $utils.extend($rootScope.artists, data);
        }).error(function(){
            next(false);
        });
    }
    
    $displayMode.setCallback('search', search);
    
    $scope.search = function() {
        $rootScope.artists = [];
        $displayMode.current('search', $scope.value);
        $displayMode.call();
    };
}]);