/* global $ */
/* global Grapnel */

var Services = (function() {
  
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

    function scrollToAnchor(anchorname) {
      var anchor = document.querySelector('a[name='+anchorname+']');
      if (anchor) {
        document.querySelector('.artists').scrollTop = anchor.offsetTop;
      }
    }
    
    function hideApplyShow(selector, toggleClass, duration, anchor) {
      var stepDuration = duration/2;
      var el = $(selector);
      el.animate({opacity: 0}, stepDuration, function() {
          el.toggleClass(toggleClass);
          if (anchor) {
            scrollToAnchor(anchor);
          }
        })
        .animate({opacity: 1}, stepDuration);
    }
    
    return {
      hideApplyShow: hideApplyShow,
      extend: extend
    };
  }
  
  function Ajax() {
  
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
      return $.get('ajax/list/artists', filterFactory(filter, params));
    }
  
    function albums(filter, params) {
      return $.get('ajax/list/albums', filterFactory(filter, params));
    }
  
    function lastalbums(filter, params) {
      params = filterFactory(filter, params);
      params.la = true;
      return $.get('ajax/list/albums', params);
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
      params.flat = !!params.flat;
      return $.get('ajax/list/search', params);
    }
  
    return {
      artists: artists,
      albums: albums,
      lastalbums: lastalbums,
      albumsbyartists: albumsbyartists,
      tracks: tracks,
      search: search
    };
  }
  
  function DisplayMode() {
    var modes = {
      artists: {
        limit: 50,
        callback: function(){}
      },
      albumsbyartists: {
        limit: 20,
        callback: function(){}
      },
      lastalbums: {
        limit: 100,
        callback: function(){}
      },
      search: {
        limit: 100,
        callback: function(){}
      }
    };
    var _skip = 0;
    var _current = 'artists';
    var _loading = false;
    var _moreToLoad = true;
    var _param = {};
    var _type = 'tags';
  
    function limit(val) {
      if (val && modes[val]) {
        modes[_current].limit = val;
      }
      return modes[_current].limit;
    }
  
    function type(val) {
      if (typeof val !== "undefined") {
        _type = val;
      }
      return _type;
    }
  
    function incSkip() {
      _skip += limit();
    }
  
    function skip(val) {
      if (typeof val !== "undefined") {
        _skip = val;
      }
      return _skip;
    }
  
    function current(val, param) {
      if (val && modes[val]) {
        _current = val;
        if (typeof param !== "undefined") _param = param;
        clean();
      }
      return _current;
    }
  
    function setCallback(mode, cb) {
      if (mode && modes[mode]) {
        modes[mode].callback = cb;
      }
    }
  
    function clean() {
      _moreToLoad = true;
      skip(0);
    }
  
    function call() {
      if (!_loading && _moreToLoad) {
        _loading = true;
        var params = {
          skip: _skip,
          limit: limit(),
          type: _type
        };
        modes[_current].callback(_param, params, function(moreToLoad){
          _loading = false;
          _moreToLoad = moreToLoad;
          incSkip();
        });
      }
    }
  
    return {
      limit: limit,
      skip: skip,
      current: current,
      setCallback: setCallback,
      call: call,
      type: type,
      clean: clean
    };
  }
  
  function Playlist() {
    this.head = null;
    this.tail = null;
    this.promise = null;
    this.listeners = {};
  }
  
  Playlist.prototype.emitChange = function() {
    var $this = this;
    clearTimeout(this.promise);
    this.promise = setTimeout(function() {
      $this.dispatchEvent(new Event('update'));
    }, 100);
  };
  
  Playlist.prototype.listeners = null;
  Playlist.prototype.addEventListener = function(type, callback) {
    if(!(type in this.listeners)) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  };
  
  Playlist.prototype.removeEventListener = function(type, callback) {
    if(!(type in this.listeners)) {
      return;
    }
    var stack = this.listeners[type];
    for(var i = 0, l = stack.length; i < l; i++) {
      if(stack[i] === callback){
        stack.splice(i, 1);
        return this.removeEventListener(type, callback);
      }
    }
  };
  
  Playlist.prototype.dispatchEvent = function(event) {
    if(!(event.type in this.listeners)) {
      return;
    }
    var stack = this.listeners[event.type];
    event.target = this;
    for(var i = 0, l = stack.length; i < l; i++) {
        stack[i].call(this, event);
    }
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
  
  function Router() {
    this.router = new Grapnel();
  }
  
  Router.prototype._parseFilters = function(filters) {
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
  
  Router.prototype._encodeFilters = function(filters) {
    var ret = 0x00;
    if (filters.artists) ret = ret | 0x01;
    if (filters.albums) ret = ret | 0x02;
    if (filters.tracks) ret = ret | 0x04;
    return ret;
  };
  
  Router.prototype.navigateSearch = function(term, filters) {
    var s = 'search/';
    if (term) s += term;
    if (filters) {
      var f = this._encodeFilters(filters);
      if (f > 0 && f < 7) {
        s += '/filters/' + f;
      }
    }
    this.router.navigate(s);
  };
  
  Router.prototype.navigateLastAlbums = function() {
    this.router.navigate('lastalbums');
  };
  
  Router.prototype.setSearchCallback = function(cb) {
    var self = this;
    this.router.get(/search\/(\w*)(?:\/filters\/([1234567])?)?/i, function(req){
      cb(req.params[0], self._parseFilters(req.params[1]));
    });
  };
  
  Router.prototype.setLastAlbumsCallback = function(cb) {
    this.router.get('lastalbums', function(req){
      cb();
    });
  };
  
  Router.prototype.ready = Router.prototype.go = function() {
    this.router.trigger('navigate');
  };
  
  return {
    ajax: Ajax(),
    displayMode: DisplayMode(),
    playlist: new Playlist(),
    notif: Notif(),
    utils: Utils(),
    router: new Router()
  };
})();