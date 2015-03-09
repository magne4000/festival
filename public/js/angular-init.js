angular.module('festival', ['infinite-scroll', 'angularLazyImg'])
.config(['lazyImgConfigProvider', function(lazyImgConfigProvider) {
    var scrollable = document.querySelector('main .container')
    lazyImgConfigProvider.setOptions({
        container: angular.element(scrollable)
        /*,
        onError: function(image){
            image.$elem.attr("src", "/images/nocover.png");
        }*/
    });
}])
.factory('$tracks', ['$rootScope', function($rootScope){
    var head = null;
    var tail = null;
    
    function getHead() {
        return head;
    }
    
    function getTail() {
        return tail;
    }
    
    function empty() {
        head = null;
        tail = null;
        $rootScope.$emit('tracks');
    }
    
    function add(track) {
        track.prev = null; // init
        track.next = null; // init
        if (!head) {
            head = track;
        }
        if (tail !== null) {
            track.prev = tail;
            tail.next = track;
        }
        tail = track;
        $rootScope.$emit('tracks');
    }
    
    function move(track, after) {
        var oldHead = head;
        if (track.prev) {
            track.prev.next = track.next;
        } else {
            head = track.next;
        }
        if (track.next) {
            track.next.prev = track.prev;
        }
        
        if (after) {
            track.prev = after;
            track.next = after.next;
            if (after.next) {
                after.next.prev = track;
            } else {
                tail = track;
            }
            after.next = track;
        } else {
            oldHead.prev = track;
            track.prev = null;
            track.next = oldHead;
            head = track;
        }
        $rootScope.$emit('tracks');
    }
    
    function remove(track) {
        if (track.next) {
            track.next.prev = track.prev;
        } else {
            tail = track.prev;
        }
        if (track.prev) {
            track.prev.next = track.next;
        } else {
            head = track.next;
        }
        $rootScope.$emit('tracks');
    }
    
    return {
        getHead: getHead,
        getTail: getTail,
        empty: empty,
        add: add,
        move: move,
        remove: remove
    };
}])
.factory('$ajax', ['$http', function($http){
    
    function filterFactory(filter, skip, limit) {
        filter = filter || {};
        var ret = {filters: filter};
        if (skip) ret.skip = skip;
        if (limit) ret.limit = limit;
        return ret;
    }
    
    function artists(filter, skip, limit) {
        return $http.get('ajax/list/artists', {params: filterFactory(filter, skip, limit)});
    }
    
    function albums(filter, skip, limit) {
        return $http.get('ajax/list/albums', {params: filterFactory(filter, skip, limit)});
    }
    
    function albumsbyartists(filter, skip, limit) {
        return $http.get('ajax/list/albumsbyartists', {params: filterFactory(filter, skip, limit)});
    }
    
    function tracks(filter) {
        return $http.get('ajax/list/tracks', {params: filterFactory(filter)});
    }
    
    function search(term, flat, skip, limit) {
        flat = !!flat;
        var params = {
            term: term, 
            skip: skip,
            limit: limit,
            flat: flat
        };
        return $http.get('ajax/list/search', {params: params});
    }
    
    return {
        artists: artists,
        albums: albums,
        albumsbyartists: albumsbyartists,
        tracks: tracks,
        search: search
    };
}])
.factory('$displayMode', [function(){
    var modes = {
        artists: {
            limit: 50,
            callback: function(){}
        },
        albumsbyartists: {
            limit: 20,
            callback: function(){}
        },
        search: {
            limit: 10,
            callback: function(){}
        },
    };
    var _skip = 0;
    var _current = 'artists';
    var _loading = false;
    var _moreToLoad = true;
    var _param = {};
    
    function limit(val) {
        if (val && modes[val]) {
            modes[_current].limit = val;
        }
        return modes[_current].limit;
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
            _param = param;
            _moreToLoad = true;
            skip(0);
        }
        return _current;
    }
    
    function setCallback(mode, cb) {
        if (mode && modes[mode]) {
            modes[mode].callback = cb;
        }
    }
    
    function call() {
        if (!_loading && _moreToLoad) {
            _loading = true;
            modes[_current].callback(_param, _skip, limit(), function(moreToLoad){
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
        call: call
    };
}])
.run([function(){
}]);