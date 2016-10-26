/* global $ */
/* global VueRouter */
/* global FestivalComponents */

var Services = (function() {
  function eventify(_class) {
    _class.prototype.listeners = {};
    
    _class.prototype.addEventListener = function(event, callback) {
      if(!(event in this.listeners)) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(callback);
    };
    _class.prototype.on = _class.prototype.addEventListener;
    
    _class.prototype.removeEventListeners = function(event) {
      if (!event) {
        this.listeners = {};
      } else {
        this.listeners[event] = [];
      }
    };
    
    _class.prototype.removeEventListener = function(event, callback) {
      if(!(event in this.listeners)) {
        return;
      }
      if (!callback) {
        this.listeners[event] = [];
      }
      var stack = this.listeners[event];
      for(var i = 0, l = stack.length; i < l; i++) {
        if(stack[i] === callback){
          stack.splice(i, 1);
          return this.removeEventListener(event, callback);
        }
      }
    };
    _class.prototype.off = _class.prototype.removeEventListener;
    
    _class.prototype.dispatchEvent = function(event) {
      if(!(event in this.listeners)) {
        return;
      }
      var stack = this.listeners[event], args = [].slice.call(arguments, 1);
      for(var i = 0; i < stack.length; i++) {
          stack[i].apply(this, args);
      }
    };
    _class.prototype.emit = _class.prototype.dispatchEvent;
    
    _class.prototype.once = function(event, callback) {
      function on() {
        this.off(event, on);
        callback.apply(this, arguments);
      }
    
      on.fn = callback;
      this.on(event, on);
      return this;
    };
  }
  
  function Utils() {

    function fixelement(element, type) {
      var typeofelt = typeof element;
      type = type || "string";

      if (typeofelt !== type) {
        if (type === "number") {
          element = Number.MAX_VALUE;
        } else if (type === "string") {
          element = 'unknown';
        }
      }

      if (type === "string") {
        element = element.toLowerCase();
      }

      return element;
    }

    function binaryIndexOf(array, key, searchElement, type, reverse) {
      var minIndex = 0;
      var maxIndex = array.length - 1;
      var currentIndex;
      var currentElement;
      var compare;
      type = type || "string";

      searchElement = fixelement(searchElement, type);
      while (minIndex <= maxIndex) {
        currentIndex = (minIndex + maxIndex) / 2 | 0;
        currentElement = array[currentIndex][key];
        currentElement = fixelement(currentElement, type);
        if (type === "string") {
          compare = searchElement.localeCompare(currentElement);
        } else if (type === "number") {
          compare = searchElement - currentElement;
        }
        if (reverse) {
          compare = -compare;
        }
        if (compare > 0) {
          minIndex = currentIndex + 1;
        } else if (compare < 0) {
          maxIndex = currentIndex - 1;
        } else {
          return currentIndex;
        }
      }
      return -1;
    }

    function basicIndexOf(array, key, searchElement, type) {
      var currentIndex;
      var currentElement;
      var compare;
      type = type || "string";
      searchElement = fixelement(searchElement, type);
      for (currentIndex=0; currentIndex<array.length; currentIndex++) {
        currentElement = array[currentIndex][key];
        currentElement = fixelement(currentElement, type);
        if (type === "string") {
          compare = searchElement.localeCompare(currentElement);
        } else if (type === "number") {
          compare = searchElement - currentElement;
        }
        if (compare === 0) return currentIndex;
      }
      return -1;
    }

    function extend(target, source, basicsearch) {
      var i, j, resArtist, resAlbum;
      for (i=0; i<source.length; i++) {
        if (!basicsearch) {
          resArtist = binaryIndexOf(target, 'name', source[i].name);
        } else {
          resArtist = basicIndexOf(target, 'name', source[i].name);
        }
        if (resArtist === -1) {
          target.push(source[i]);
        } else if (source[i].albums) {
          for (j=0; j<source[i].albums.length; j++) {
            if (!basicsearch) {
              resAlbum = binaryIndexOf(target[resArtist].albums, 'year', source[i].albums[j].year, "number", true);
            } else {
              resAlbum = basicIndexOf(target[resArtist].albums, 'year', source[i].albums[j].year, "number");
            }
            if (resAlbum === -1) {
              target[resArtist].albums.push(source[i].albums[j]);
            } else if (source[i].albums[j].tracks) {
              Array.prototype.push.apply(target[resArtist].albums[resAlbum].tracks, source[i].albums[j].tracks);
            }
          }
        }
      }
    }
    
    function scrollToArtist(id) {
      scrollToAnchor('ar_' + id);
    }

    function scrollToAnchor(anchorname) {
      if (!anchorname) return;
      var anchor = document.querySelector('a[name='+anchorname+']');
      if (anchor) {
        document.querySelector('.artists').scrollTop = anchor.offsetTop;
      }
    }
    
    function animateAlbumsPanel(hideOrShow, selector, toggleClass, duration, cb) {
      var stepDuration = duration/2;
      var el = $(selector);
      el.animate({opacity: 0}, stepDuration, function() {
          if (hideOrShow === 'hide') {
            el.removeClass(toggleClass);
          } else {
            el.addClass(toggleClass);
          }
          if (typeof cb === 'function') cb();
        })
        .animate({opacity: 1}, stepDuration);
    }
    
    return {
      animateAlbumsPanel: animateAlbumsPanel,
      scrollToArtist: scrollToArtist,
      extend: extend
    };
  }
  
  function Ajax() {
    var last = null;
    
    function filterFactory(filter, params) {
      filter = filter || {};
      var ret = {filters: JSON.stringify(filter)};
      for (var key in params) {
        if (typeof params[key] !== "undefined") {
          ret[key] = params[key];
        }
      }
      return ret;
    }
  
    function artists(filter, params) {
      last = $.get('ajax/list/artists', filterFactory(filter, params));
      return last;
    }
  
    function lastalbums(filter, params) {
      last = $.get('ajax/list/lastalbums', filterFactory(filter, params));
      return last;
    }
  
    function albumsbyartists(filter, params) {
      return $.get('ajax/list/albumsbyartists', filterFactory(filter, params));
    }
  
    function tracks(filter, params) {
      params = filterFactory(filter, params);
      return $.get('ajax/list/tracks', params);
    }
  
    function search(term, filter, params) {
      params = filterFactory(filter, params);
      params.term = term;
      last = $.get('ajax/list/search', params);
      return last;
    }
    
    function abortLast() {
      if (last) {
        last.abort();
      }
    }
  
    return {
      artists: artists,
      lastalbums: lastalbums,
      albumsbyartists: albumsbyartists,
      tracks: tracks,
      search: search,
      abortLast: abortLast
    };
  }
  
  function DisplayMode() {
    this.modes = {
      artists: {
        limit: 50
      },
      albumsbyartists: {
        limit: 20
      },
      lastalbums: {
        limit: 20
      },
      search: {
        limit: 10
      }
    };
    this._skip = 0;
    this._current = 'artists';
    this._moreToLoad = true;
    this._param = {};
    this._type = 'tags';
    this._promise = null;
  }
  eventify(DisplayMode);
  
  DisplayMode.prototype.limit = function(val) {
    if (val && this.modes[val]) {
      this.modes[this._current].limit = val;
    }
    return this.modes[this._current].limit;
  };

  DisplayMode.prototype.type = function(val) {
    if (typeof val !== "undefined") {
      this._type = val;
    }
    return this._type;
  };

  DisplayMode.prototype.incSkip = function() {
    this._skip += this.limit();
    return this;
  };

  DisplayMode.prototype.skip = function(val) {
    if (typeof val !== "undefined") {
      this._skip = val;
    }
    return this._skip;
  };
  
  DisplayMode.prototype.param = function(param) {
    if (typeof param !== "undefined") {
      this._param = param;
    }
    return this._param;
  };

  DisplayMode.prototype.current = function(val, param) {
    if (val && this.modes[val] && this._current !== val) {
      this._current = val;
      this.emit('modechanged', val);
      this.param(param);
      this.clean();
    }
    return this._current;
  };

  DisplayMode.prototype.clean = function() {
    this._moreToLoad = true;
    this.skip(0);
    return this;
  };

  DisplayMode.prototype.call = function(clean) {
    var $this = this;
    clearTimeout(this._promise);
    this._promise = setTimeout(function() {
      $this._call(clean);
    }, 150);
    return this;
  };
  
  DisplayMode.prototype._call = function(clean) {
    if (clean) this.clean();
    if (this._moreToLoad) {
      Services.ajax.abortLast();
      var params = {
        skip: this._skip,
        limit: this.limit(),
        type: this._type
      }, current = this._current, self = this;
      
      var next = function(moreToLoad) {
        self._loading = false;
        self._moreToLoad = moreToLoad;
        self.incSkip();
        self.emit('after', current);
        self.emit(current + '.after');
      };
      this.emit('before', current, !!clean);
      this.emit(current + '.before', !!clean);
      this.emit(current, !!clean, this._param, params, next);
    }
    return this;
  };
  
  function Playlist() {
    this.head = null;
    this.tail = null;
    this.promise = null;
  }
  eventify(Playlist);
  
  Playlist.prototype.emitChange = function() {
    var $this = this;
    clearTimeout(this.promise);
    this.promise = setTimeout(function() {
      $this.dispatchEvent('update');
    }, 100);
  };
  
  Playlist.prototype.getHead = function() {
    return this.head;
  };
  
  Playlist.prototype.getTail = function() {
    return this.tail;
  };
  
  Playlist.prototype.empty = function() {
    this.head = null;
    this.tail = null;
    this.emitChange();
  };
  
  Playlist.prototype.add = function(track) {
    track = JSON.parse(JSON.stringify(track));
    track.prev = null; // init
    track.next = null; // init
    if(this.head === null) {
      this.head = track;
    }
    if(this.tail !== null) {
      track.prev = this.tail;
      this.tail.next = track;
    }
    this.tail = track;
    this.emitChange();
    return track;
  };
  
  Playlist.prototype.move = function(track, after) {
    var oldHead = this.head;
    if(track.prev !== null) {
      track.prev.next = track.next;
    }
    else {
      this.head = track.next;
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
        this.tail = track;
      }
      after.next = track;
    }
    else {
      oldHead.prev = track;
      track.prev = null;
      track.next = oldHead;
      this.head = track;
    }
    this.emitChange();
  };
  
  Playlist.prototype.remove = function(track) {
    if(track.next !== null) {
      track.next.prev = track.prev;
    }
    else {
      this.tail = track.prev;
    }
    if(track.prev !== null) {
      track.prev.next = track.next;
    }
    else {
      this.head = track.next;
    }
    this.emitChange();
  };
  
  Playlist.prototype.get = function(ind) {
    ind = parseInt(ind, 10);
    if(ind < 0) ind = 0;
    if(ind === 0) return this.head;
    var count = 1,
      track = this.head;
    while(track.next !== null && count <= ind) {
      count += 1;
      track = track.next;
    }
    return track;
  };
  
  Playlist.prototype.size = function() {
    if(this.head === null) return 0;
    else {
      var count = 1, track = this.head;
      while(track.next !== null) {
        count += 1;
        track = track.next;
      }
      return count;
    }
  };
  
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
  
  function Router() {}
  eventify(Router);
  
  Router.prototype.decodeFilters = function(filters) {
    var pfilters = parseInt(filters, 10), ret = {
      artists: true,  // 0x01
      albums: true,   // 0x02
      tracks: true    // 0x04
    };
    if (!isNaN(pfilters) && pfilters >= 0 && pfilters <= 7) {
      ret.artists = (pfilters & 0x01) > 0;
      ret.albums = (pfilters & 0x02) > 0;
      ret.tracks = (pfilters & 0x04) > 0;
    }
    return ret;
  };
  
  Router.prototype.encodeFilters = function(filters) {
    var ret = 0x00;
    if (filters.artists) ret = ret | 0x01;
    if (filters.albums) ret = ret | 0x02;
    if (filters.tracks) ret = ret | 0x04;
    return ret;
  };
  
  Router.prototype.parseArtistId = function(id) {
    id = parseInt(id, 10);
    if (!isNaN(id)) {
      return id;
    }
    return null;
  };
  
  Router.prototype.navigateSearch = function(term, filters) {
    var dict = {
      name: 'search',
      params: {
        term: term
      }
    };
    if (filters) {
      var f = this.encodeFilters(filters);
      if (f > 0 && f < 7) {
        dict.params.filters = f;
        dict.name = 'searchf';
      }
    }
    this.router.push(dict);
  };
  
  Router.prototype.navigateLastAlbums = function() {
    this.router.push({name: 'lastalbums'});
  };
  
  Router.prototype.navigateHome = function() {
    this.router.push({name: 'home'});
  };
  
  Router.prototype.selectArtist = function(id) {
    this.router.push({query: {s: id}});
  };
  
  Router.prototype.init = function() {
    
    var routes = [
      {
        path: '/search/:term/filters/:filters',
        name: 'searchf',
        meta: {
          displayMode: 'search'
        },
        component: FestivalComponents.Container
      },
      {
        path: '/search/:term',
        name: 'search',
        meta: {
          displayMode: 'search'
        },
        component: FestivalComponents.Container
      },
      {
        path: '/lastalbums',
        name: 'lastalbums',
        meta: {
          displayMode: 'lastalbums'
        },
        component: FestivalComponents.Container
      },
      {
        path: '/',
        name: 'home',
        meta: {
          displayMode: 'artists'
        },
        component: FestivalComponents.Container
      }
    ];
    
    this.router = new VueRouter({
      routes: routes
    });
    
    return this;
  };
  
  return {
    ajax: Ajax(),
    displayMode: new DisplayMode(),
    playlist: new Playlist(),
    notif: Notif(),
    utils: Utils(),
    Router: new Router()
  };
})();