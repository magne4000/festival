/* global Services */
/* global buzz */
/* global Vue */
/* global $ */

var festival = {
  currentTrack: null,
  playing: false,
  volume: 100
};

function Player(playlist) {
  var indicesAlreadyPlayed = [];
  var indicesToBePlayed = [];
  var currentIndice = 0;
  var timer = null;
  var currentlyPrefetching = null;
  var usingAdd = false;
  var sounds = {};
  var self = {
    data: {
      festival : festival,
      currentSound : null,
      shuffle : false,
      loop : 0,
      buffered : 0,
      duration : 0,
      waitingbuf : false,
      progressValue : 0
    },
    methods: {},
    computed: {}
  };

  self.methods._next = function _next(bypassLoop) {
    if(this.festival.currentTrack) {
      if(!bypassLoop && this.loop === 2) {
        return this.festival.currentTrack;
      }
      if(this.shuffle) {
        if(indicesToBePlayed.length === 0) {
          if(this.loop === 1) {
            // in loop and the playlist has been finished, so reset
            indicesToBePlayed = indicesAlreadyPlayed;
            indicesAlreadyPlayed = [];
          }
          else {
            return null;
          }
        }
        if(indicesToBePlayed.length > 0) {
          var randno = Math.floor(Math.random() * indicesToBePlayed.length),
            ind = indicesToBePlayed[randno];
          indicesAlreadyPlayed.push(ind);
          indicesToBePlayed.splice(randno, 1);
          currentIndice = ind;
          return playlist.get(ind);
        }
      }
      if(!this.festival.currentTrack.next && this.loop === 1) {
        return playlist.getHead();
      }
      return this.festival.currentTrack.next;
    }
    return null;
  };

  self.methods._prev = function _prev() {
    if(this.festival.currentTrack) {
      if(this.shuffle) {
        if(indicesAlreadyPlayed.length === 0) {
          return null;
        }
        indicesToBePlayed.push(indicesAlreadyPlayed.pop());
        currentIndice = indicesToBePlayed[indicesToBePlayed.length - 1];
        return playlist.get(currentIndice);
      }
      if(this.festival.currentTrack.prev === null && this.loop === 1) {
        return playlist.getTail();
      }
      return this.festival.currentTrack.prev;
    }
    return null;
  };

  self.methods._stop = function _stop() {
    if(this.currentSound) {
      /*if (!$scope.currentSound.fullyLoaded) {
          $scope.currentSound.unload();
      }*/
      this.currentSound.stop();
    }
  };

  self.methods._play = function _play() {
    if(this.currentSound) {
      this.currentSound.play();
    }
  };

  self.methods._attach = function _attach(asound) {
    this.currentSound = asound;
    if(asound) {
      asound.onCompleteLoad(asound.fullyLoaded);
    }
  };

  self.methods._loadNext = function _loadNext() {
    var nextTrack = this._next(true);
    if(nextTrack) {
      this.load(nextTrack, false, true); // preload next track
    }
  };
  
  self.methods.showind = function showind() {
    return arguments[arguments[0] + 1];
  };
  
  self.methods.play = function play(track, tracks) {
    this._stop();
    if(!track) { // 0 param, Currently loaded track
      this._play();
    }
    else if(!tracks) { // 1 param, Load another track
      this.load(track, true);
    }
    else { // 2 params, load multiple tracks, play one of them
      this.add(tracks, true, track.id);
    }
  };
  
  self.methods.next = function next(autoPlay, bypassLoop) {
    var nextTrack = this._next(bypassLoop);
    this._stop();
    if(nextTrack) {
      this.load(nextTrack, autoPlay);
    }
  };
  
  self.methods.prev = function prev(autoPlay) {
    var prevTrack = this._prev();
    this._stop();
    if(prevTrack) {
      this.load(prevTrack, autoPlay);
    }
  };
  
  self.methods.add = function add(track, autoPlay, idToPlay) {
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
    if(!usingAdd) {
      usingAdd = true;
      var tracklist = [],
        trackslen = playlist.size(),
        orilen = trackslen,
        randno = null,
        loadthisone = null;
      if(!!track.id) { // only one track
        tracklist.push(track);
      }
      else {
        tracklist = track;
      }
      if(this.shuffle) {
        randno = Math.floor(Math.random() * tracklist.length);
      }
      for(var ind in tracklist) {
        indicesToBePlayed.push(indicesToBePlayed.length);
        var addedTrack = playlist.add(tracklist[ind]);
        if(idToPlay === tracklist[ind].id) {
          loadthisone = addedTrack;
        }
        else if(trackslen === 0 && !this.shuffle) {
          // First track, load it (if not in shuffle mode)
          loadthisone = addedTrack;
        }
        else if(randno === trackslen && orilen === 0 && this.shuffle) {
          // load random track
          loadthisone = addedTrack;
        }
        trackslen++;
      }
      this.load(loadthisone, autoPlay);
      usingAdd = false;
    }
  };
  
  self.methods.remove = function remove(track) {
    if(track) {
      playlist.remove(track);
    }
  };
  
  self.methods.load = function load(track, autoPlay, prefetch) {
    if(track) {
      clearTimeout(timer);
      var $loadscope = this;
      timer = setTimeout(function() {
        if(!prefetch) {
          $loadscope.festival.currentTrack = track;
        }
        if(autoPlay) {
          $loadscope._stop();
        }
        var soundId = 't_' + track.id;
        if(currentlyPrefetching !== null && soundId != currentlyPrefetching.id) {
          /* currentlyPrefetching.unload(); */
          currentlyPrefetching = null;
        }
        var asound = sounds[soundId];
        if(asound) {
          if(autoPlay) {
            asound.play();
          }
        }
        else {
          asound = new buzz.sound(track.url, {
            webAudioApi: false,
            preload: true,
            autoplay: !!autoPlay,
            type: track.mimetype,
            volume: $loadscope.volume || 100
          });
          asound.id = soundId;
          asound.bind('progress', function() {
            var $this = this;
            var buffered = this.getBuffered();
            var duration = this.getDuration();
            if($this.id == self.data.currentSound.id) {
              if(this.waitingbuf && buffered.length > 0) {
                this.waitingbuf = false;
              }
              self.data.duration = duration;
              self.data.buffered = buffered;
            }
            else {
              currentlyPrefetching = $this;
            }
            if(!$this.fullyLoaded && buffered.length > 0 ? parseFloat(buffered[buffered.length - 1].end) >= parseFloat(duration) : false) {
              $this.fullyLoaded = true;
              setTimeout(function() {
                $this.onCompleteLoad(true);
              }, 0);
            }
          }).bind('timeupdate', function() {
            self.data.progressValue = this.getTime();
          }).bind('loadstart', function() {
            if(this.id == self.data.currentSound.id) {
              self.data.waitingbuf = true;
            }
          }).bind('ended', function() {
            self.data.progressValue = 0;
            self.data.festival.playing = false;
            self.methods.next(true);
          }).bind('abort', function() {
            self.data.progressValue = 0;
            self.data.festival.playing = false;
          }).bind('pause', function() {
            self.data.festival.playing = false;
          }).bind('play', function() {
            this.setVolume(self.data.festival.volume);
            Services.notif('Now playing', self.data.festival.currentTrack.name + ', by ' + self.data.festival.currentTrack.artist_name + ', on ' + self.data.festival.currentTrack.album_name);
          }).bind('playing', function() {
            self.data.festival.playing = true;
          }).bind('error', function(e) {
            console.log(e, this.sound);
          }).bind('sourceerror', function(e) {
            console.log(e);
          });
          asound.onCompleteLoad = function(bLoadNext) {
            var $this = this;
            currentlyPrefetching = null;
            if($this.id == self.data.currentSound.id) {
              if(track.failed) track.failed = false;
              self.data.duration = $this.getDuration();
              self.data.buffered = $this.getBuffered();
              if(bLoadNext) {
                this._loadNext();
              }
            }
          };
          sounds[soundId] = asound;
        }
        if(!prefetch) {
          $loadscope._attach(asound);
        }
      }, 10);
    }
  };
  
  self.methods.togglePlayPause = function togglePlayPause() {
    Vue.nextTick(function() {
      if(this.currentSound) {
        this.currentSound.togglePlay();
      }
    });
  };
  
  self.methods.playOrPause = function playOrPause(track, tracks) {
    var $this = this;
    Vue.nextTick(function() {
      if(!track || ($this.festival.currentTrack && $this.festival.currentTrack.id === track.id)) {
        $this.currentSound.togglePlay();
      }
      else {
        if(tracks) {
          $this.empty();
        }
        $this.play(track, tracks);
      }
    });
  };
  
  self.methods.toggleShuffle = function toggleShuffle() {
    this.shuffle = !this.shuffle;
    //clear already played tracks list
    indicesAlreadyPlayed = [];
  };
  
  self.methods.circleLoop = function circleLoop() {
    this.loop = (this.loop + 1) % 3;
  };
  
  self.methods.empty = function empty() {
    indicesAlreadyPlayed = [];
    indicesToBePlayed = [];
    currentIndice = 0;
    playlist.empty();
  };
  
  self.computed.progress = {
    get: function() {
      return this.progressValue;
    },
    set: function(val) {
      this.progressValue = val;
      if(val && this.currentSound) {
        this.currentSound.setTime(val);
      }
    }
  };
  
  $(document).on('keydown', null, 'space', function(e) {
    e.preventDefault();
    self.methods.togglePlayPause();
  });
  
  $(document).on('keydown', null, 'left', function(e) {
    e.preventDefault();
    self.methods.prev(self.data.festival.playing);
  });
  
  $(document).on('keydown', null, 'right', function(e) {
    e.preventDefault();
    self.methods.next(self.data.festival.playing);
  });
  
  return self;
}

function Toolbar(v_container) {
  function areFiltersEqual(a, b) {
    if (typeof b === 'undefined' || typeof a === 'undefined') return false;
    return a.artists === b.artists && a.albums === b.albums && a.tracks === b.tracks;
  }
  var self = {
    data: {
      value: "",
      type: {text: 'Tags', value: 'tags'},
      types: [
        {
          text: 'Tags',
          value: 'tags'
        },
        {
          text: 'Folder',
          value: 'folder'
        }
      ],
      checkboxFilter: {
        artists: true,
        albums: true,
        tracks: true
      },
      festival: festival,
      displaymode: 'search'
    },
    methods: {},
    computed: {},
    watch: {}
  };
  var promise = null;
  var lastValue = "";
  var lastvolume = 100;

  function search(term, params, next) {
      v_container.loading = true;
      params.flat = false;
      Services.ajax.search(term, self.data.checkboxFilter, params).done(function(data, status) {
          v_container.loading = false;
          next((data.data.length > 0));
          Services.utils.extend(v_container.artists, data.data);
      }).fail(function(){
          v_container.loading = false;
          next(false);
      });
  }

  Services.displayMode.setCallback('search', search);

  self.watch.checkboxFilter = {
    handler: function(newValue, oldValue) {
      if (!areFiltersEqual(newValue, oldValue)) {
        $location.search('sar', newValue.artists);
        $location.search('sal', newValue.albums);
        $location.search('str', newValue.tracks);
        clearTimeout(promise);
        promise = setTimeout(this.searchnow, 700);
      }
    },
    deep: true
  };

  self.methods.typechanged = function(type) {
      Services.displayMode.type(type.value);
      clearTimeout(promise);
      promise = setTimeout(function() {
          v_container.artists = [];
          Services.displayMode.clean();
          Services.displayMode.call();
      }, 400);
  };

  self.methods.search = function() {
      if (lastValue !== this.value) {
          lastValue = this.value;
          clearTimeout(promise);
          promise = setTimeout(this.searchnow, 400);
      }
  };
  
  self.computed.volume = {
    get: function() {
      return this.festival.volume;
    },
    set: function(val) {
      if(typeof val === "string") {
        val = parseInt(val, 10);
      }
      if(typeof val === "number") {
        this.festival.volume = val;
        if(this.currentSound) {
          Vue.nextTick(function() {
            buzz.setVolume(val);
          });
        }
      }
    }
  };
  
  self.methods.toggleVolume = function toggleVolume() {
    if(this.festival.volume === 0) {
      this.volume = lastvolume;
    }
    else {
      lastvolume = this.festival.volume;
      this.volume = 0;
    }
  };

  self.methods.searchnow = function() {
      v_container.artists = [];
      if (this.value.length > 0) {
          Services.displayMode.current('search', this.value);
      } else {
          Services.displayMode.current('artists', {});
      }
      this.displaymode = 'search';
      if (this.value === '') {
          $location.search('s', null);
      } else {
          $location.search('s', this.value);
      }
      $location.search('la', null);
      Services.displayMode.call();
  };

  self.methods.lastalbums = function() {
      v_container.artists = [];
      Services.displayMode.current('lastalbums', {});
      this.displaymode = 'lastalbums';
      this.value = "";
      $location.search('la', 'true');
      $location.search('s', null);
      $location.search('sar', null);
      $location.search('sal', null);
      $location.search('str', null);
      Services.displayMode.call();
  };
/*
  var unbind = $scope.$on('$locationChangeSuccess', function() {
      unbind();
      var triggersearchnow = true;
      var params = $location.search();
      if (typeof params.sar !== "undefined") {
          params.sar = (params.sar === true);
          if (this.checkboxFilter.artists !== params.sar) triggersearchnow = false;
          this.checkboxFilter.artists = params.sar;
      }
      if (typeof params.sal !== "undefined") {
          params.sal = (params.sal === true);
          if (this.checkboxFilter.albums !== params.sal) triggersearchnow = false;
          this.checkboxFilter.albums = params.sal;
      }
      if (typeof params.str !== "undefined") {
          params.str = (params.str === true);
          if (this.checkboxFilter.tracks !== params.str) triggersearchnow = false;
          this.checkboxFilter.tracks = params.str;
      }
      if (typeof params.s !== "undefined") {
          this.value = params.s;
      } else if (typeof params.la !== "undefined") {
          this.lastalbums();
          triggersearchnow = false;
      }
      if (triggersearchnow) {
        this.searchnow();
      }
  });*/
  
  return self;
}

function Container(v_player) {
  var self = {
    data: {
      festival: festival,
      artists: [],
      loading: false,
      selectedArtist: {}
    },
    watch: {},
    methods: {}
  };

  function loadArtists(filter, params, next) {
    this.loading = true;
    Services.ajax.artists(filter, params).done(function(data, status) {
      self.data.loading = false;
      next((data.data.length > 0));
      Services.utils.extend(self.data.artists, data.data);
    }).fail(function(){
      self.data.loading = false;
      next(false);
    });
  }

  function loadAlbumsByArtists(filter, params, next) {
    this.loading = true;
    Services.ajax.albumsbyartists(filter, params).done(function(data, status) {
      self.data.loading = false;
      next((data.data.length > 0));
      Services.utils.extend(self.data.artists, data.data);
    }).fail(function(){
      self.data.loading = false;
      next(false);
    });
  }

  function loadLastAlbums(filter, params, next) {
    this.loading = true;
    Services.ajax.lastalbums(filter, params).done(function(data, status) {
      self.data.loading = false;
      next((data.data.length > 0));
      Services.utils.extend(self.data.artists, data.data);
    }).fail(function(){
      self.data.loading = false;
      next(false);
    });
  }

  Services.displayMode.setCallback('artists', loadArtists);
  Services.displayMode.setCallback('albumsbyartists', loadAlbumsByArtists);
  Services.displayMode.setCallback('lastalbums', loadLastAlbums);
  Services.displayMode.current('artists', {});
  
  self.watch.selectedArtist = function(val, oldVal) {
    if (!oldVal.id && val.id) {
      // showing
      Services.utils.flipit('.artist', 600, 'show-albums', '#container');
    } else if (oldVal.id && !val.id) {
      // hiding
      Services.utils.flipit('.artist', 600, 'show-albums', '#container');
    }
  };

  self.methods.pageArtists = function() {
    Services.displayMode.call();
  };

  self.methods.loadAlbums = function(artist, params) {
    this.selectedArtist = artist;
    if (artist.albums && artist.albums.length > 0) {
      return;
    }
    params = params || {};
    params.type = Services.displayMode.type();
    var filter = {
      artist: artist.id
    };
    Services.ajax.albumsbyartists(filter, params).done(function(data, status) {
      if (data.data.length > 0) {
        //artist.expanded = true;
        artist.albums = data.data[0].albums;
      } else {
        //artist.expanded = false;
      }
    });
  };
  
  self.methods.toggleArtistSelection = function(artist) {
    if (this.selectedArtist === artist) {
      this.selectedArtist = {};
    } else {
      this.selectedArtist = artist;
    }
  };

  self.methods.loadAlbumsAndTracks = function(artist, flat, callback) {
    if (!artist.albums) {
      var filter = {artist: artist.id};
      var params = {
        flat: !!flat,
        type: Services.displayMode.type()
      };
      artist.loading = true;
      Services.ajax.tracks(filter, params).done(function(data, status) {
        artist.loading = false;
        artist.albums = data.data[0].albums;
        if (typeof callback === "function") callback(artist);
      }).fail(function(){
        artist.loading = false;
      });
    } else if (typeof callback === "function") {
      setTimeout(function() {
        callback(artist);
      }, 0);
    }
  };

  self.methods.loadAlbumsAndTracksAndAdd = function(artist, autoplay) {
    this.loadAlbumsAndTracks(artist, false, function(artist1) {
      if (artist1.albums) {
        for (var i=0; i<artist1.albums.length; i++) {
          v_player.add(artist1.albums[i].tracks, autoplay);
          autoplay = false;
        }
      }
    });
  };

  self.methods.loadTracks = function(artist, album, callback) {
    if (album.tracks && album.tracks.length > 0) {
      if (typeof callback === "function") {
        setTimeout(function() {
          callback(artist, album);
        }, 0);
      }
    } else {
      var filter = {artist: artist.id, album: album.id};
      var params = {
        flat: true,
        type: Services.displayMode.type()
      };
      Services.ajax.tracks(filter, params).done(function(data, status) {
        album.tracks = data.data;
        if (typeof callback === "function") callback(artist, album);
      });
    }
  };

  self.methods.loadTracksAndAdd = function(artist, album, autoplay) {
    this.loadTracks(artist, album, function(artist1, album1) {
      v_player.add(album1.tracks, autoplay);
    });
  };

  self.methods.downloadArtist = function(artist) {
    window.location = 'download/artist/' + artist.id + '?type=' + Services.displayMode.type();
  };

  self.methods.downloadAlbum = function(album) {
    window.location = 'download/album/' + album.id + '?type=' + Services.displayMode.type();
  };

  self.methods.downloadTrack = function(track) {
    window.location = 'music/' + track.id + '?type=' + Services.displayMode.type();
  };
  
  self.methods.add = v_player.add.bind(v_player);
  self.methods.playOrPause = v_player.playOrPause.bind(v_player);
  
  return self;
}

function Queue() {
  var self = {
    data: {
      tracks: [],
      show: false
    }
  }

  function computeTracks() {
      $scope.$apply(function(){
          var track = $tracks.getHead();
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

  //TODO $rootScope.$on('tracks', computeTracks);
  return self;
}

var filters = {
  duration: function(diffInS) {
    diffInS = Math.floor(diffInS);
    if (isNaN(diffInS)) return '--';
    var diffInMinutes = Math.max(0, Math.floor(diffInS / 60));
    diffInS = diffInS % 60;
    return [
      ('0'+diffInMinutes).slice(-2),
      ('0'+diffInS).slice(-2)
    ].join(':');
  }
};

// title
var player = Player(Services.playlist);
player.el = 'title';
Vue.config.debug = true;
var v_title = new Vue(player);

// player
player.el = '#player';
player.filters = filters;
var v_player = new Vue(player);

// artists
var main = Container(v_player);
main.el = '#container';
main.filters = filters;
var v_container = new Vue(main);

// toolbar
var toolbar = Toolbar(v_container);
toolbar.el = '#toolbar';
var v_toolbar = new Vue(toolbar);

// queue
var queue = Queue();
queue.el = '#queue';
queue.filters = filters;
var v_queue = new Vue(queue);
