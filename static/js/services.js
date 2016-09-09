/* global $ */
/* global FLIP */

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
    
    function flipit(selector, duration, toggleClass, toggleSelector) {
      var ars = document.querySelectorAll(selector), fg = [];
      for (var i = 0; i < ars.length; ++i) {
        fg.push({
          element: ars[i],
          duration: duration
        });
      }
      var flip = new FLIP.group(fg);
      
      // First position & opacity.
      flip.first();
      
      // Apply the 'end' class and snapshot the last position & opacity.
      if (toggleSelector) {
        document.querySelector(toggleSelector).classList.toggle(toggleClass);
        flip.last();
      } else {
        flip.last(toggleClass);
      }
      
      // Move and fade the element back to the original position.
      flip.invert();
      
      // Play it forwards.
      flip.play();
    }

    return {
      extend: extend,
      flipit: flipit
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
  
  return {
    ajax: Ajax(),
    displayMode: DisplayMode(),
    playlist: Playlist(),
    notif: Notif(),
    utils: Utils()
  };
})();