/* global Services */
/* global buzz */
/* global Vue */
/* global $ */

var festival = {
  state: {
    currentTrack: null,
    playing: false,
    volume: 100,
    artists: [],
    albums: [],
    tracks: [],
    selectedArtist: {}
  },
  clean: function() {
    this.state.artists = [];
    this.state.albums = [];
    this.state.tracks = [];
  },
  selectArtist: function(id) {
    if (this.state.selectedArtist.id === id) return;
    var found = false;
    if (typeof id === 'number') {
      for (var i=0; !found && i<this.state.artists.length; i++) {
        if (this.state.artists[i].id === id) {
          this.state.selectedArtist = this.state.artists[i];
          found = true;
        }
      }
    }
    
    if (!found) {
      this.state.selectedArtist = {};
    }
  },
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
      shared: festival.state,
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
    if(this.shared.currentTrack) {
      if(!bypassLoop && this.loop === 2) {
        return this.shared.currentTrack;
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
      if(!this.shared.currentTrack.next && this.loop === 1) {
        return playlist.getHead();
      }
      return this.shared.currentTrack.next;
    }
    return null;
  };

  self.methods._prev = function _prev() {
    if(this.shared.currentTrack) {
      if(this.shuffle) {
        if(indicesAlreadyPlayed.length === 0) {
          return null;
        }
        indicesToBePlayed.push(indicesAlreadyPlayed.pop());
        currentIndice = indicesToBePlayed[indicesToBePlayed.length - 1];
        return playlist.get(currentIndice);
      }
      if(this.shared.currentTrack.prev === null && this.loop === 1) {
        return playlist.getTail();
      }
      return this.shared.currentTrack.prev;
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
          $loadscope.shared.currentTrack = track;
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
            volume: $loadscope.shared.volume || 100
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
            $loadscope.shared.playing = false;
            $loadscope.next(true);
          }).bind('abort', function() {
            $loadscope.progressValue = 0;
            $loadscope.shared.playing = false;
          }).bind('pause', function() {
            $loadscope.shared.playing = false;
          }).bind('playing', function() {
            $loadscope.shared.playing = true;
            Services.notif('Now playing', $loadscope.shared.currentTrack.name + ', by ' + $loadscope.shared.currentTrack.artist_name + ', on ' + $loadscope.shared.currentTrack.album_name);
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
      if(!track || ($this.shared.currentTrack && $this.shared.currentTrack.id === track.id)) {
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
      $this.prev($this.shared.playing);
    });
    
    $(document).on('keydown', null, 'right', function(e) {
      e.preventDefault();
      $this.next($this.shared.playing);
    });
  };
  
  return self;
}

function Toolbar() {
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
      shared: festival.state,
      toolbarstate: 'search'
    },
    methods: {},
    computed: {},
    watch: {}
  };
  var promise = null;
  var lastValue = "";
  var lastvolume = 100;

  self.watch.checkboxFilter = {
    handler: function(newValue, oldValue) {
      clearTimeout(promise);
      promise = setTimeout(this.searchnow.bind(this), 700);
    },
    deep: true
  };
  
  self.watch['$route'] = 'onRouteChange';
  
  self.methods.selectArtistCallback = function(newId, oldId) {
    if (oldId !== newId) {
      festival.selectArtist(newId);
      if ((!oldId && newId) || (oldId && !newId)) {
        Services.utils.animateAlbumsPanel((!oldId && newId) ? 'show' : 'hide', '#container', 'show-albums', 500, function() {
          Services.utils.scrollToArtist(newId || oldId);
        });
      } else {
        Services.utils.scrollToArtist(newId || oldId);
      }
    }
  };
  
  self.methods.onRouteChange = function(to, from) {
    var $this = this, refresh = false;
    
    if (!from) {
      from = {
        query: {},
        meta: {},
        params: {}
      };
    }
    
    function selectArtistCallback() {
      var from_s = Services.Router.parseArtistId(from.query.s);
      var to_s = Services.Router.parseArtistId(to.query.s);
      $this.selectArtistCallback(to_s, from_s);
    }
    
    // displayMode changed
    if (to.meta.displayMode !== from.meta.displayMode) {
      var param = to.params.term || {};
      Services.displayMode.current(to.meta.displayMode, param);
      refresh = true;
    }
    // search term changed
    if (to.params.term !== from.params.term) {
      this.value = to.params.term;
      Services.displayMode.param(to.params.term);
      refresh = true;
    }
    // filters changed
    if (to.params.filters !== from.params.filters) {
      var filters = Services.Router.decodeFilters(to.params.filters);
      if (this.checkboxFilter.artists !== filters.artists) {
        this.checkboxFilter.artists = filters.artists;
        refresh = true;
      }
      if (this.checkboxFilter.albums !== filters.albums) {
        this.checkboxFilter.albums = filters.albums;
        refresh = true;
      }
      if (this.checkboxFilter.tracks !== filters.tracks) {
        this.checkboxFilter.tracks = filters.tracks;
        refresh = true;
      }
    }
    if (refresh) {
      Services.displayMode.once('after', selectArtistCallback);
      Services.displayMode.call(true);
    } else {
      // selectedArtist changed
      selectArtistCallback();
    }
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
      return this.shared.volume;
    },
    set: function(val) {
      if(typeof val === "string") {
        val = parseInt(val, 10);
      }
      if(typeof val === "number") {
        this.shared.volume = val;
        if(this.currentSound) {
          Vue.nextTick(function() {
            buzz.setVolume(val);
          });
        }
      }
    }
  };
  
  self.methods.toggleVolume = function toggleVolume() {
    if(this.shared.volume === 0) {
      this.volume = lastvolume;
    }
    else {
      lastvolume = this.shared.volume;
      this.volume = 0;
    }
  };

  self.methods.searchnow = function() {
    Services.Router.navigateSearch(this.value, this.checkboxFilter);
  };

  self.methods.lastalbums = function() {
    Services.Router.navigateLastAlbums();
  };
  
  self.methods.home = function() {
    Services.Router.navigateHome();
  };
  
  self.created = function() {
    this.onRouteChange(this.$route, null);
  };
  
  return self;
}

function Queue(playlist) {
  var self = {
    data: {
      shared: festival.state,
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
    playlist.addEventListener('update', this.updateTracksOnNextTick.bind(this));
  };
  
  self.methods.empty = playlist.empty.bind(playlist);
  self.methods.playOrPause = Views.player.playOrPause.bind(Views.player);
  self.methods.remove = playlist.remove.bind(playlist);
  
  return self;
}

var Filters = {
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
var Views = {};
festival.player = Player(Services.playlist);
Vue.config.debug = true;
new Vue({
  el: 'title',
  data: festival.player.data
});

// player
Views.player = new Vue({
  el: '#player',
  data: festival.player.data,
  methods: festival.player.methods,
  computed: festival.player.computed,
  filters: Filters,
});

Views.init = function() {
  Services.Router.init();
  
  // container
  new Vue({
    el: '#container',
    template: '<f-container></f-container>',
    router: Services.Router.router
  });
  
  // toolbar
  var toolbar = Toolbar();
  toolbar.el = '#toolbar';
  toolbar.router = Services.Router.router;
  new Vue(toolbar);
  
  // queue
  var queue = Queue(Services.playlist);
  queue.el = '#queue';
  queue.filters = Filters;
  new Vue(queue);
};