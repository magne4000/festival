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
            volume: $loadscope.festival.volume || 100
          });
          asound.id = soundId;
          asound.bind('progress', function() {
            var $this = this;
            var buffered = this.getBuffered();
            var duration = this.getDuration();
            if($this.id == $loadscope.currentSound.id) {
              if(this.waitingbuf && buffered.length > 0) {
                this.waitingbuf = false;
              }
              $loadscope.duration = duration;
              $loadscope.buffered = buffered;
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
            $loadscope.progressValue = this.getTime();
          }).bind('loadstart', function() {
            if(this.id == $loadscope.currentSound.id) {
              $loadscope.waitingbuf = true;
            }
          }).bind('ended', function() {
            $loadscope.progressValue = 0;
            $loadscope.festival.playing = false;
            $loadscope.next(true);
          }).bind('abort', function() {
            $loadscope.progressValue = 0;
            $loadscope.festival.playing = false;
          }).bind('pause', function() {
            $loadscope.festival.playing = false;
          }).bind('playing', function() {
            $loadscope.festival.playing = true;
            Services.notif('Now playing', $loadscope.festival.currentTrack.name + ', by ' + $loadscope.festival.currentTrack.artist_name + ', on ' + $loadscope.festival.currentTrack.album_name);
          }).bind('error', function(e) {
            console.log(e, this.sound);
          }).bind('sourceerror', function(e) {
            console.log(e);
          });
          asound.onCompleteLoad = function(bLoadNext) {
            var $this = this;
            currentlyPrefetching = null;
            if($this.id == $loadscope.currentSound.id) {
              if(track.failed) track.failed = false;
              $loadscope.duration = $this.getDuration();
              $loadscope.buffered = $this.getBuffered();
              if(bLoadNext) {
                $loadscope._loadNext();
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
    var $this = this;
    Vue.nextTick(function() {
      if($this.currentSound) {
        $this.currentSound.togglePlay();
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
  
  self.created = function created() {
    var $this = this;
    $(document).on('keydown', null, 'space', function(e) {
      e.preventDefault();
      $this.togglePlayPause();
    });
    
    $(document).on('keydown', null, 'left', function(e) {
      e.preventDefault();
      $this.prev($this.festival.playing);
    });
    
    $(document).on('keydown', null, 'right', function(e) {
      e.preventDefault();
      $this.next($this.festival.playing);
    });
  };
  
  return self;
}

function Toolbar(v_container) {
  var self = {
    data: {
      value: "",
      type: 'tags',
      types: ['tags', 'folder'],
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
    v_container.loading.artists = true;
    params.flat = false;
    Services.ajax.search(term, self.data.checkboxFilter, params).done(function(data, status) {
      v_container.loading.artists = false;
      Services.utils.extend(v_container.artists, data.data);
      next((data.data.length > 0));
    }).fail(function(){
      v_container.loading.artists = false;
      next(false);
    });
  }

  Services.displayMode.on('search', search);

  self.watch.checkboxFilter = {
    handler: function(newValue, oldValue) {
      clearTimeout(promise);
      promise = setTimeout(this.searchnow.bind(this), 700);
    },
    deep: true
  };

  self.methods.typechanged = function(type) {
    this.type = type;
    Services.displayMode.type(type);
    clearTimeout(promise);
    promise = setTimeout(function() {
      Services.displayMode.cleanAndCall();
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
  
  self.methods.applyusualstate = function() {
    v_container.artists = [];
    if (this.value.length > 0) {
      Services.displayMode.current('search', this.value);
    } else {
      Services.displayMode.current('artists', {});
    }
    this.displaymode = 'search';
  };

  self.methods.searchnow = function() {
    Services.router.navigateSearch(this.value, this.checkboxFilter);
  };
  
  self.methods.applylastalbumsstate = function() {
    v_container.artists = [];
    Services.displayMode.current('lastalbums', {});
    this.displaymode = 'lastalbums';
    this.value = "";
  };

  self.methods.lastalbums = function() {
    Services.router.navigateLastAlbums();
  };

  self.created = function created() {
    var $this = this, oldsearch = '', oldfilters = {
      artists: true,
      albums: true,
      tracks: true
    }, cleanAndCallInProgress = false;

    Services.displayMode.on('search.before', function() {
      cleanAndCallInProgress = true;
      $this.applyusualstate();
    });
    Services.displayMode.on('lastalbums.before', function() {
      cleanAndCallInProgress = true;
      $this.applylastalbumsstate();
    });
    Services.displayMode.on('search.after', function() {
      cleanAndCallInProgress = false;
    });
    Services.displayMode.on('lastalbums.after', function() {
      cleanAndCallInProgress = false;
    });

    Services.router.on('artistselected', function(artistid) {
      if (!cleanAndCallInProgress) {
        console.log('s direct');
        v_container.selectArtist(artistid);
      } else {
        Services.displayMode.once('after', function() {
          console.log('s postponed');
          v_container.selectArtist(artistid);
        });
      }
    });
    Services.router.on('search', function(term, filters) {
      var refresh = false;
      if (term !== oldsearch) {
        oldsearch = term ? term : '';
        $this.value = oldsearch;
        refresh = true;
      }
      if (oldfilters.artists !== filters.artists) {
        oldfilters.artists = filters.artists;
        $this.checkboxFilter.artists = oldfilters.artists;
        refresh = true;
      }
      if (oldfilters.albums !== filters.albums) {
        oldfilters.albums = filters.albums;
        $this.checkboxFilter.albums = oldfilters.albums;
        refresh = true;
      }
      if (oldfilters.tracks !== filters.tracks) {
        oldfilters.tracks = filters.tracks;
        $this.checkboxFilter.tracks = oldfilters.tracks;
        refresh = true;
      }
      if (refresh) {
        Services.displayMode.cleanAndCall('search');
      }
    });
    Services.router.on('lastalbums', function() {
      Services.displayMode.cleanAndCall('lastalbums');
    });
    Services.router.init();
  };
  
  return self;
}

function Container(v_player) {
  var self = {
    data: {
      festival: festival,
      artists: [],
      loading: {
        artists: false,
        albums: false
      },
      selectedArtist: {}
    },
    watch: {},
    methods: {}
  };

  Services.displayMode.current('artists', {});
  
  self.watch.artists = function(val, oldVal) {
    if (val !== oldVal && (val.length > 0 || oldVal.length > 0)) {
      var $this = this;
      if (this.artists.indexOf(this.selectedArtist) === -1) {
        Vue.nextTick(function() {
          $this.selectedArtist = {};
        });
      }
    }
  };
  
  self.watch.selectedArtist = function(val, oldVal) {
    if (val !== oldVal) {
      if ((!oldVal.id && val.id) || (oldVal.id && !val.id)) {
        Services.utils.hideApplyShow('#container', 'show-albums', 500, function() {
          Services.router.selectArtist(val.id);
          Services.utils.scrollToArtist(val.id || oldVal.id);
        });
      } else {
        Services.router.selectArtist(val.id);
        Services.utils.scrollToArtist(val.id || oldVal.id);
      }
    }
  };
  
  self.methods.loadX = function(fct, filter, params, loadingkey, next) {
    var $this = this;
    this.loading[loadingkey] = true;
    fct(filter, params).done(function(data, status) {
      $this.loading[loadingkey] = false;
      next((data.data.length > 0));
      Services.utils.extend($this.artists, data.data);
    }).fail(function(){
      $this.loading[loadingkey] = false;
      next(false);
    });
  };
  
  self.methods.selectArtist = function(id) {
    if (this.selectedArtist.id === id) return;
    var found = false;
    if (typeof id === 'number') {
      for (var i=0; !found && i<this.artists.length; i++) {
        if (this.artists[i].id === id) {
          this.selectedArtist = this.artists[i];
          found = true;
        }
      }
    }
    
    if (!found) {
      this.selectedArtist = {};
    }
  };
  
  self.methods.loadArtists = function loadArtists(filter, params, next) {
    this.loadX(Services.ajax.artists, filter, params, 'artists', next);
  };

  self.methods.loadAlbumsByArtists = function loadAlbumsByArtists(filter, params, next) {
    this.loadX(Services.ajax.albumsbyartists, filter, params, 'albums', next);
  };

  self.methods.loadLastAlbums = function loadLastAlbums(filter, params, next) {
    this.loadX(Services.ajax.lastalbums, filter, params, 'artists', next);
  };

  self.methods.pageArtists = function() {
    // Here nextTick allow all other events like 'create' on components
    // to be fired before
    Vue.nextTick(Services.displayMode.call.bind(Services.displayMode));
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
        artist.albums = data.data[0].albums;
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
      var $this = this;
      this.loading.albums = true;
      Services.ajax.tracks(filter, params).done(function(data, status) {
        $this.loading.albums = false;
        artist.albums = data.data[0].albums;
        if (typeof callback === "function") callback(artist);
      }).fail(function(){
        $this.loading.albums = false;
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
      var $this = this;
      this.loading.albums = true;
      Services.ajax.tracks(filter, params).done(function(data, status) {
        album.tracks = data.data;
        $this.loading.albums = false;
        if (typeof callback === "function") callback(artist, album);
      }).fail(function(){
        $this.loading.albums = false;
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
  self.methods.empty = v_player.empty.bind(v_player);
  
  self.created = function created() {
    var $this = this;
    
    Services.displayMode.on('artists', this.loadArtists.bind(this));
    Services.displayMode.on('albumsbyartists', this.loadAlbumsByArtists.bind(this));
    Services.displayMode.on('lastalbums', this.loadLastAlbums.bind(this));
    
    $(document).on('keydown', null, 'esc', function(e) {
      e.preventDefault();
      $this.selectedArtist = {};
    });
  };
  
  return self;
}

function Queue(playlist, v_player) {
  var self = {
    data: {
      festival: festival,
      tracks: [],
      show: false
    },
    methods: {}
  };
  
  self.methods.updateTracksOnNextTick = function() {
    Vue.nextTick(this.updateTracks.bind(this));
  };
  
  self.methods.updateTracks = function() {
    var head = playlist.getHead(), tracks = [];
    if (head) {
      var track = head;
      tracks.push(track);
      while (track.next && track.next !== head) {
        tracks.push(track.next);
        track = track.next;
      }
    }
    this.tracks = tracks;
  };
  
  self.methods.tracktitle = function(track) {
    return 'Track: ' + track.name + '\nAlbum: ' + track.album_name + '\nArtist: ' + track.artist_name;
  };
  
  self.created = function created() {
    playlist.addEventListener('update', this.updateTracksOnNextTick);
  };
  
  self.methods.empty = playlist.empty.bind(playlist);
  self.methods.playOrPause = v_player.playOrPause.bind(v_player);
  self.methods.remove = playlist.remove.bind(playlist);
  
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
var queue = Queue(Services.playlist, v_player);
queue.el = '#queue';
queue.filters = filters;
var v_queue = new Vue(queue);
