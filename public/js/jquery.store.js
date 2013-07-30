(function($) {
    var version = "1.0",
        methods = {
        init : function(options) {
            $.store.tracks = {};
            $.store.uniqidhead = null;
            $.store.uniqidtail = null;
            try {
                $.store.localstorage = !!localStorage.getItem;
            } catch(e) {
                $.store.localstorage = false;
            }
            if ($.store.localstorage === false){
                return this;
            }
            var oldTracks = $.store('_getTracks');
            $.store.uniqidhead = $.store('_getUniqidHead');
            $.store.uniqidtail = $.store('_getUniqidTail');
            if ($.store('_version') == $.store('version') && len(oldTracks) > 0){
                $.store.tracks = oldTracks;
            }else{
                $.store('empty');
                $.store('_updateVersion');
            }
            return this;
        },
        setTracks : function(pl){
            $.store.tracks = pl;
            if ($.store.localstorage){
                localStorage.tracks = JSON.stringify(pl);
            }
            return this;
        },
        add : function(track, loop){
            var pl = $.store('getTracks'), head = $.store('_getUniqidHead'), tail = $.store('_getUniqidTail');
            track.prev = null; // init
            track.next = null; // init
            if(len(pl) === 0){
                $.store('_setUniqidHead', track.uniqid);
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
            $.store('_setUniqidTail', track.uniqid);
            pl[track.uniqid] = track;
            $.store('setTracks', pl);
            return this;
        },
        move : function(uniqid, after){
            var pl = $.store('getTracks'), oldhead = $.store('_getUniqidHead');

            if (pl[uniqid].prev !== null){
                pl[pl[uniqid].prev].next = pl[uniqid].next;
            }else{
                $.store('_setUniqidHead', pl[uniqid].next);
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
                    $.store('_setUniqidTail', uniqid);
                }
                pl[after].next = uniqid;
            }else{ // Put in first place
                pl[oldhead].prev = uniqid;
                pl[uniqid].prev = null;
                pl[uniqid].next = pl[oldhead].uniqid;
                $.store('_setUniqidHead', uniqid);
            }
            /*Debug
            var head = $.store('_getUniqidHead'), elt = pl[head], i = 10;
            console.log('');
            while (1){
                console.log(elt.name);
                if (elt.next == null) break;
                if (pl[elt.next] == head || i <= 0) {
                    console.log('loop');
                    break;
                }
                elt = pl[elt.next];
                i--;
            }
            console.log('');
            //End debug */
            $.store('setTracks', pl);
            return this;
        },
        empty : function(){
            $.store('setTracks', {});
            $.store('_setUniqidHead', null);
            $.store('_setUniqidTail', null);
            return this;
        },
        remove : function(uniqid){
            var pl = $.store('getTracks');
            if(pl[uniqid].next !== null){
                pl[pl[uniqid].next].prev = pl[uniqid].prev;
            }else{
                $.store('_setUniqidTail', pl[uniqid].prev);
            }
            if(pl[uniqid].prev !== null){
                pl[pl[uniqid].prev].next = pl[uniqid].next;
            }else{
                $.store('_setUniqidHead', pl[uniqid].next);
            }
            delete pl[uniqid];
            $.store('setTracks', pl);
            return this;
        },
        toggleLoop : function(){
            var pl = $.store('getTracks'), head = $.store('_getUniqidHead'), tail = $.store('_getUniqidTail');
            if (pl[head].prev !== null){ // Loop ON, switch it OFF
                pl[head].prev = null;
                pl[tail].next = null;
            }else{ // Loop OFF, switch it ON
                pl[head].prev = pl[tail].uniqid;
                pl[tail].next = pl[head].uniqid;
            }
            $.store('setTracks', pl);
        },
        _version : function(){
            if ($.store.localstorage){
                var v;
                try {
                    v = !!localStorage.version;
                } catch(e) {
                    v = false;
                }
                if (v !== false){
                    return localStorage.version;
                }
            }
            return false;
        },
        _updateVersion : function(){
            if ($.store.localstorage){
                localStorage.version = version;
            }
            return this;
        },
        version : function(){
            return version;
        },
        _getUniqidHead : function(){
            if ($.store.localstorage && !!localStorage.uniqidhead){
                return localStorage.uniqidhead;
            }
            return null;
        },
        _setUniqidHead : function(uniqidhead){
            if ($.store.localstorage){
                localStorage.uniqidhead = uniqidhead;
            }
            return this;
        },
        _getUniqidTail : function(){
            if ($.store.localstorage && !!localStorage.uniqidtail){
                return localStorage.uniqidtail;
            }
            return null;
        },
        _setUniqidTail : function(uniqidtail){
            if ($.store.localstorage){
                localStorage.uniqidtail = uniqidtail;
            }
            return this;
        },
        _getTracks : function(){
            if($.store.localstorage && !!localStorage.tracks){
                return JSON.parse(localStorage.tracks);
            }
            return {};
        },
        getLoopState : function() {
            var pl = $.store('getTracks');
            if (len(pl) === 0) return null;
            return pl[$.store('_getUniqidHead')].prev !== null;
        },
        getTracks : function(){
            return $.store.tracks;
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