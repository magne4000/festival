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
    
    uniqid: function (prefix, more_entropy) {
        // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +    revised by: Kankrelune (http://www.webfaktory.info/)
        // %        note 1: Uses an internal counter (in php_js global) to avoid collision
        // *     example 1: uniqid();
        // *     returns 1: 'a30285b160c14'
        // *     example 2: uniqid('foo');
        // *     returns 2: 'fooa30285b1cd361'
        // *     example 3: uniqid('bar', true);
        // *     returns 3: 'bara20285b23dfd1.31879087'
        if (typeof prefix == 'undefined') {
            prefix = "";
        }
    
        var retId;
        var formatSeed = function (seed, reqWidth) {
            seed = parseInt(seed, 10).toString(16); // to hex str
            if (reqWidth < seed.length) { // so long we split
                return seed.slice(seed.length - reqWidth);
            }
            if (reqWidth > seed.length) { // so short we pad
                return Array(1 + (reqWidth - seed.length)).join('0') + seed;
            }
            return seed;
        };
    
        // BEGIN REDUNDANT
        if (!this.php_js) {
            this.php_js = {};
        }
        // END REDUNDANT
        if (!this.php_js.uniqidSeed) { // init seed with big random int
            this.php_js.uniqidSeed = Math.floor(Math.random() * 0x75bcd15);
        }
        this.php_js.uniqidSeed++;
    
        retId = prefix; // start with prefix, add current milliseconds hex string
        retId += formatSeed(parseInt(new Date().getTime() / 1000, 10), 8);
        retId += formatSeed(this.php_js.uniqidSeed, 5); // add seed hex string
        if (more_entropy) {
            // for more entropy we add a float lower to 10
            retId += (Math.random() * 10).toFixed(8).toString();
        }
    
        return retId;
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
