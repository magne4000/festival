(function($) {
    var version = "1.1",
        methods = {
        init : function(options) {
            $.store.data = {};
            $.store.localstorage = (typeof window.localstorage !== 'undefined');
            if (version === $.store('get', 'version', true)){
                $.store('get', 'tracks', true);
                $.store('get', 'head', true);
                $.store('get', 'tail', true);
                $.store('get', 'volume', true);
                $.store('get', 'shuffle', true);
                $.store('get', 'loop', true);
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
                var val = null;
                if ($.store.localstorage) {
                    val = localStorage[name];
                } else { //cookie fallback
                    $.store("_readCookie", name)
                }
                if (typeof val !== 'undefined' && val !== null) {
                    $.store.data[name] = JSON.parse(val);
                }
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
                    if ($.store.localstorage) {
                        if (typeof localStorage[name] !== 'undefined') {
                            delete localStorage[name];
                        }
                    }else{
                        $.store("_deleteCookie", name);
                    }
                }else{
                    if ($.store.localstorage) {
                        localStorage[name] = JSON.stringify($.store.data[name]);
                    }else{
                        $.store("_createCookie", name, JSON.stringify($.store.data[name]));
                    }
                }
            }
            return this;
        },
        add: function(track){
            var pl = $.store('get', 'tracks'), head = $.store('get', 'head'), tail = $.store('get', 'tail');
            track.prev = null; // init
            track.next = null; // init
            if(utils.len(pl) === 0){
                $.store('set', 'head', track.uniqid);
                pl = {};
            }
            if (!!tail){
                track.prev = pl[tail].uniqid;
                pl[tail].next = track.uniqid;
            }
            $.store('set', 'tail', track.uniqid);
            pl[track.uniqid] = track;
            $.store('set', 'tracks', pl);
            $.store('persist');
            return this;
        },
        move : function(uniqid, after){
            var pl = $.store('get', 'tracks'), oldhead = $.store('get', 'head');

            if (pl[uniqid].prev !== null){
                pl[pl[uniqid].prev].next = pl[uniqid].next;
            }else{
                $.store('set', 'head', pl[uniqid].next);
            }
            if (pl[uniqid].next !== null){
                pl[pl[uniqid].next].prev = pl[uniqid].prev;
            }

            if (after !== null){
                pl[uniqid].prev = after;
                pl[uniqid].next = pl[after].next;
                if (pl[after].next !== null){
                    pl[pl[after].next].prev = uniqid;
                }else{ // Put in last place
                    $.store('set', 'tail', uniqid);
                }
                pl[after].next = uniqid;
            }else{ // Put in first place
                pl[oldhead].prev = uniqid;
                pl[uniqid].prev = null;
                pl[uniqid].next = pl[oldhead].uniqid;
                $.store('set', 'head', uniqid);
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
        remove : function(uniqid){
            var pl = $.store('get', 'tracks');
            if(pl[uniqid].next !== null){
                pl[pl[uniqid].next].prev = pl[uniqid].prev;
            }else{
                $.store('set', 'tail', pl[uniqid].prev);
            }
            if(pl[uniqid].prev !== null){
                pl[pl[uniqid].prev].next = pl[uniqid].next;
            }else{
                $.store('set', 'head', pl[uniqid].next);
            }
            delete pl[uniqid];
            $.store('set', 'tracks', pl);
            $.store('persist');
            return this;
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