/* global buzz */
/* global Vue */
/* global $ */

function Playlist() {
  var head = null;
  var tail = null;
  var promise = null;

  function emitChange() {
    clearTimeout(promise);
    promise = setTimeout(function() {
      $.event.trigger('tracks');
    }, 100);
  }

  function getHead() {
    return head;
  }

  function getTail() {
    return tail;
  }

  function empty() {
    head = null;
    tail = null;
    emitChange();
  }

  function add(track) {
    track = JSON.parse(JSON.stringify(track));
    track.prev = null; // init
    track.next = null; // init
    if(head === null) {
      head = track;
    }
    if(tail !== null) {
      track.prev = tail;
      tail.next = track;
    }
    tail = track;
    emitChange();
    return track;
  }

  function move(track, after) {
    var oldHead = head;
    if(track.prev !== null) {
      track.prev.next = track.next;
    }
    else {
      head = track.next;
    }
    if(track.next !== null) {
      track.next.prev = track.prev;
    }
    if(after) {
      track.prev = after;
      track.next = after.next;
      if(after.next !== null) {
        after.next.prev = track;
      }
      else {
        tail = track;
      }
      after.next = track;
    }
    else {
      oldHead.prev = track;
      track.prev = null;
      track.next = oldHead;
      head = track;
    }
    emitChange();
  }

  function remove(track) {
    if(track.next !== null) {
      track.next.prev = track.prev;
    }
    else {
      tail = track.prev;
    }
    if(track.prev !== null) {
      track.prev.next = track.next;
    }
    else {
      head = track.next;
    }
    emitChange();
  }

  function get(ind) {
    ind = parseInt(ind, 10);
    if(ind < 0) ind = 0;
    if(ind === 0) return head;
    var count = 1,
      track = head;
    while(track.next !== null && count <= ind) {
      count += 1;
      track = track.next;
    }
    return track;
  }

  function size() {
    if(head === null) return 0;
    else {
      var count = 1,
        track = head;
      while(track.next !== null) {
        count += 1;
        track = track.next;
      }
      return count;
    }
  }
  return {
    getHead: getHead,
    getTail: getTail,
    empty: empty,
    add: add,
    move: move,
    remove: remove,
    size: size,
    get: get
  };
}
var playlist = Playlist();

function Notif() {
    var granted = false;
    if (!("Notification" in window)) {
        granted = false;
    } else if (Notification.permission === "granted") {
        granted = true;
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
            if(!('permission' in Notification)) {
                Notification.permission = permission;
            }
            granted = permission === "granted";
        });
    }

    return function(title, body, timeout){
        if (granted) {
            var options = {
                'icon': 'static/images/favicon.png',
                'silent': true
            };
            timeout = timeout || 5000;
            if (body) options.body = body;
            var notif = new Notification(title, options);
            setTimeout(function(){
                if (notif) {
                    notif.close();
                }
            }, timeout);
            return notif;
        }
    };
}
var notif = Notif();

function Player(playlist) {
  var indicesAlreadyPlayed = [];
  var indicesToBePlayed = [];
  var currentIndice = 0;
  var timer = null;
  var currentlyPrefetching = null;
  var lastvolume = 100;
  var usingAdd = false;
  var sounds = {};
  var self = {
    data: {
      currentTrack : null,
      currentSound : null,
      shuffle : false,
      loop : 0,
      buffered : 0,
      duration : 0,
      playing : false,
      volumeval : 100,
      waitingbuf : false,
      _progress : 0
    },
    methods: {},
    computed: {}
  };

  self.methods._next = function _next(bypassLoop) {
    if(this.currentTrack) {
      if(!bypassLoop && this.loop === 2) {
        return this.currentTrack;
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
      if(!this.currentTrack.next && this.loop === 1) {
        return playlist.getHead();
      }
      return this.currentTrack.next;
    }
    return null;
  };

  self.methods._prev = function _prev() {
    if(this.currentTrack) {
      if(this.shuffle) {
        if(indicesAlreadyPlayed.length === 0) {
          return null;
        }
        indicesToBePlayed.push(indicesAlreadyPlayed.pop());
        currentIndice = indicesToBePlayed[indicesToBePlayed.length - 1];
        return playlist.get(currentIndice);
      }
      if(this.currentTrack.prev === null && this.loop === 1) {
        return playlist.getTail();
      }
      return this.currentTrack.prev;
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
      timer = setTimeout(function() {
        if(!prefetch) {
          this.currentTrack = track;
        }
        if(autoPlay) {
          this._stop();
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
            volume: this.volume() || 100
          });
          asound.id = soundId;
          asound.bind('progress', function() {
            var self = this;
            var buffered = this.getBuffered();
            var duration = this.getDuration();
            if(self.id == this.currentSound.id) {
              if(this.waitingbuf && buffered.length > 0) {
                this.waitingbuf = false;
              }
              this.duration = duration;
              this.buffered = buffered;
            }
            else {
              currentlyPrefetching = self;
            }
            if(!self.fullyLoaded && buffered.length > 0 ? parseFloat(buffered[buffered.length - 1].end) >= parseFloat(duration) : false) {
              self.fullyLoaded = true;
              setTimeout(function() {
                self.onCompleteLoad(true);
              }, 0);
            }
          }).bind('timeupdate', function() {
            self.data._progress = this.getTime();
          }).bind('loadstart', function() {
            if(this.id == self.data.currentSound.id) {
              self.data.waitingbuf = true;
            }
          }).bind('ended', function() {
            self.data._progress = 0;
            self.data.playing = false;
            self.methods.next(true);
          }).bind('abort', function() {
            self.data._progress = 0;
            self.data.playing = false;
          }).bind('pause', function() {
            self.data.playing = false;
          }).bind('play', function() {
            this.setVolume(self.methods.volume());
            notif('Now playing', self.data.currentTrack.name + ', by ' + self.data.currentTrack.artist_name + ', on ' + self.data.currentTrack.album_name);
          }).bind('playing', function() {
            self.data.playing = true;
          }).bind('error', function(e) {
            console.log(e, this.sound);
          }).bind('sourceerror', function(e) {
            console.log(e);
          });
          asound.onCompleteLoad = function(bLoadNext) {
            var self = this;
            currentlyPrefetching = null;
            if(self.id == self.data.currentSound.id) {
              if(track.failed) track.failed = false;
              self.data.duration = self.getDuration();
              self.data.buffered = self.getBuffered();
              if(bLoadNext) {
                this._loadNext();
              }
            }
          };
          sounds[soundId] = asound;
        }
        if(!prefetch) {
          this._attach(asound);
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
    Vue.nextTick(function() {
      if(!track || (this.currentTrack && this.currentTrack.id === track.id)) {
        this.currentSound.togglePlay();
      }
      else {
        if(tracks) {
          this.empty();
        }
        this.play(track, tracks);
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
    cache: false,
    get: function() {
      return this._progress;
    },
    set: function(val) {
      this._progress = val;
      if(val && this.currentSound) {
        this.currentSound.setTime(val);
      }
    }
  };
  
  self.methods.volume = function volume(val) {
    if(typeof val === "string") {
      val = parseInt(val, 10);
    }
    if(typeof val === "number") {
      this.volumeval = val;
      if(this.currentSound) {
        Vue.nextTick(function() {
          buzz.setVolume(val);
        });
      }
    }
    return this.volumeval;
  };
  
  self.methods.toggleVolume = function toggleVolume() {
    if(this.volumeval === 0) {
      this.volume(lastvolume);
    }
    else {
      lastvolume = this.volumeval;
      this.volume(0);
    }
  };
  
  $(document).on('keydown', null, 'space', function(e) {
    e.preventDefault();
    self.methods.togglePlayPause();
  });
  
  $(document).on('keydown', null, 'left', function(e) {
    e.preventDefault();
    self.methods.prev(self.data.playing);
  });
  
  $(document).on('keydown', null, 'right', function(e) {
    e.preventDefault();
    self.methods.next(self.data.playing);
  });
  
  return self;
}

var player = Player();
player.el = 'title';
Vue.config.debug = true;
var v_title = new Vue(player);
player.el = '#player';
player.filters = {
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

var v_player = new Vue(player);
