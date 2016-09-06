/* global $ */
/* global angular */
angular.module('festival', ['infinite-scroll', 'angularLazyImg', 'ngDropdowns'])
.config(['lazyImgConfigProvider', '$locationProvider', function(lazyImgConfigProvider, $locationProvider) {
    var scrollable = document.getElementById('container');
    lazyImgConfigProvider.setOptions({
        container: angular.element(scrollable)
    });

    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    }).hashPrefix('!');
}])
.config(['$interpolateProvider', function($interpolateProvider) {
    $interpolateProvider.startSymbol('{[');
    $interpolateProvider.endSymbol(']}');
}])
.factory('$ajax', ['$http', function($http){

    function filterFactory(filter, params) {
        filter = filter || {};
        var ret = {filters: filter};
        for (var key in params) {
            if (typeof params[key] !== "undefined") {
                ret[key] = params[key];
            }
        }
        return ret;
    }

    function artists(filter, params) {
        return $http.get('ajax/list/artists', {params: filterFactory(filter, params)});
    }

    function albums(filter, params) {
        return $http.get('ajax/list/albums', {params: filterFactory(filter, params)});
    }

    function lastalbums(filter, params) {
        params = filterFactory(filter, params);
        params.la = true;
        return $http.get('ajax/list/albums', {params: params});
    }

    function albumsbyartists(filter, params) {
        return $http.get('ajax/list/albumsbyartists', {params: filterFactory(filter, params)});
    }

    function tracks(filter, params) {
        params = filterFactory(filter, params);
        return $http.get('ajax/list/tracks', {params: params});
    }

    function search(term, filter, params) {
        params = filterFactory(filter, params);
        params.term = term;
        params.flat = !!params.flat;
        return $http.get('ajax/list/search', {params: params});
    }

    return {
        artists: artists,
        albums: albums,
        lastalbums: lastalbums,
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
}])

.factory('$utils', [function(){

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

    return {
        extend: extend
    };
}])
.run([function(){
    $(document).on("click", ".container .controls>.control.animate", function(evt) {
        var elt = $(evt.target).parents('.album');
        if (elt.length == 0) elt = $(evt.target).parents('.artist');
        elt.effect( "transfer", { to: $( ".handle" ) });
    });
}]);