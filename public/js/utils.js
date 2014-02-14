var utils = {
	keyCode: {
        BACKSPACE: 8,
        COMMA: 188,
        DELETE: 46,
        DOWN: 40,
        END: 35,
        ENTER: 13,
        ESCAPE: 27,
        HOME: 36,
        LEFT: 37,
        PAGE_DOWN: 34,
        PAGE_UP: 33,
        PERIOD: 190,
        RIGHT: 39,
        SPACE: 32,
        TAB: 9,
        UP: 38
    },
    
    clone: function(obj){
        if(typeof(obj) != 'object' || obj === null){
            return obj;
        }
        var newInstance = obj.constructor();
        for(var i in obj){
            newInstance[i] = utils.clone(obj[i]);
        }
        return newInstance;
    },
    
    len: function(obj) {
        if (!obj){
            return 0;
        }
        var length = obj.length ? obj.length : 0;
        for (var _ in obj)
            length++;
        return length;
    },
    
    array_flip: function(trans) {
        var key = null, tmp_ar = {};
        for (key in trans) {
            tmp_ar[trans[key]] = key;
        }
        return tmp_ar;
    },
    
    format_duration: function(diffInS) {
        diffInS = Math.floor(diffInS);
        var diffInMinutes = Math.max(0, Math.floor(diffInS / 60));
        diffInS = diffInS % 60;
        return [
            ('0'+diffInMinutes).slice(-2),
            ('0'+diffInS).slice(-2)
        ].join(':');
    }
};
