(function($) {
    var version = "1.0",
        methods = {
        init : function(options) {
            $.store.data = {};
            if (version === $.store('get', 'version', true)){
                $.store('get', 'tracks', true);
                $.store('get', 'head', true);
                $.store('get', 'tail', true);
            }else{
                $.store('empty');
                $.store('set', 'version', version);
            }
            return this;
        },
        _createCookie : function(name, value, days){
            var expires = "";
            if (!!days) {
                var date = new Date();
                date.setTime(date.getTime()+(days*24*60*60*1000));
                expires = "; expires="+date.toGMTString();
            }
            document.cookie = name+"="+value+expires+"; path=/";
        },
        _readCookie: function(name) {
            var nameEQ = name + "=",
                ca = document.cookie.split(';'),
                c = null;
            for(var i=0; i<ca.length; i++) {
                c = ca[i];
                while (c.charAt(0) === ' '){
                    c = c.substring(1, c.length);
                }
                if (c.indexOf(nameEQ) === 0){
                    return c.substring(nameEQ.length, c.length);
                }
            }
            return null;
        },
        _deleteCookie: function(name){
            $.store('_createCookie', name, "", -1);
        },
        get: function(name, persist){
            if (!!persist){
                $.store.data[name] = JSON.parse($.store("_readCookie", name));
            }
            return $.store.data[name];
        },
        set: function(name, val){
            $.store.data[name] = val;
            return this;
        },
        persist: function(){
            for (var name in $.store.data){
                if ($.store.data[name] === null){
                    $.store("_deleteCookie", name);
                }else{
                    $.store("_createCookie", name, JSON.stringify($.store.data[name]));
                }
            }
            return this;
        },
        add: function(track, loop){
            var pl = $.store('get', 'tracks'), head = $.store('get', 'head'), tail = $.store('get', 'tail');
            track.prev = null; // init
            track.next = null; // init
            if(len(pl) === 0){
                $.store('set', 'head', track.uniqid);
            }
            if (!is_null(tail)){
                track.prev = pl[tail].uniqid;
                pl[tail].next = track.uniqid;
            }
            if(len(pl) > 0){
                if (pl[head].prev !== null){ // Loop ON
                    pl[head].prev = track.uniqid;
                    track.next = pl[head].uniqid;
                }
            }else{
                if (!!loop){
                    track.next = track.uniqid;
                    track.prev = track.uniqid;
                }
            }
            $.store('set', 'tail', track.uniqid);
            pl[track.uniqid] = track;
            $.store('set', 'tracks', pl);
            $.store('persist');
            return this;
        },
        move : function(id, after){
            var pl = $.store('get', 'tracks'), oldhead = $.store('get', 'head');

            if (pl[id].prev !== null){
                pl[pl[id].prev].next = pl[id].next;
            }else{
                $.store('set', 'head', pl[id].next);
            }
            if (pl[id].next !== null){
                pl[pl[id].next].prev = pl[id].prev;
            }

            if (after !== null){
                pl[id].prev = after;
                pl[id].next = pl[after].next;
                if (pl[after].next !== null){
                    pl[pl[after].next].prev = id;
                }else{ // Put in last place
                    $.store('set', 'tail', id);
                }
                pl[after].next = id;
            }else{ // Put in first place
                pl[oldhead].prev = id;
                pl[id].prev = null;
                pl[id].next = pl[oldhead].uniqid;
                $.store('set', 'head', id);
            }
            $.store('set', 'tracks', pl);
            $.store('persist');
            return this;
        },
        empty : function(){
            $.store('set', 'tracks', null);
            $.store('set', 'head', null);
            $.store('set', 'tail', null);
            $.store('persist');
            return this;
        },
        remove : function(id){
            var pl = $.store('get', 'tracks');
            if(pl[id].next !== null){
                pl[pl[id].next].prev = pl[id].prev;
            }else{
                $.store('set', 'tail', pl[id].prev);
            }
            if(pl[id].prev !== null){
                pl[pl[id].prev].next = pl[id].next;
            }else{
                $.store('set', 'head', pl[id].next);
            }
            delete pl[id];
            $.store('set', 'tracks', pl);
            $.store('persist');
            return this;
        },
        toggleLoop : function(){
            var pl = $.store('get', 'tracks'), head = $.store('get', 'head'), tail = $.store('get', 'tail');
            if (pl[head].prev !== null){ // Loop ON, switch it OFF
                pl[head].prev = null;
                pl[tail].next = null;
            }else{ // Loop OFF, switch it ON
                pl[head].prev = pl[tail].uniqid;
                pl[tail].next = pl[head].uniqid;
            }
            $.store('set', 'tracks', pl);
            $.store('persist');
        },
        getLoopState : function() {
            var pl = $.store('get', 'tracks');
            if (len(pl) === 0) return null;
            return pl[$.store('get', 'head')].prev !== null;
        }
    };
    
    $.extend({
        store: function(method) {
            // Method calling logic
            if (methods[method]) {
                return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
            } else if (typeof method === 'object' || !method) {
                return methods.init.apply(this, arguments);
            } else {
                $.error('jQuery.store: Method ' + method + ' does not exist');
            }
        }
    });
    $.store();
})(jQuery);