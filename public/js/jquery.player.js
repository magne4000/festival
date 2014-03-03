(function($) {
    var methods = {
        init: function(options) {
            if (!options){
                options = {};
            }
            return this.each(function() {
                var $this = $(this), data = $this.data('player');
                // If the plugin hasn't been initialized yet
                if (!data) {
                    $this.data('player', {
                        target: $this,
                        currentUniqId: null,
                        currentSound: null, // SoundManager object
                        shuffle: options.shuffle || false,
                        loop: options.loop || false,
                        volume: options.volume || 100,
                        uniqidsAlreadyPlayed: [], // already played
                        uniqidsToBePlayed: [], // not played yet
                        timer: null
                    });
                }
                
                $this.trigger('playercreate');
            });
        },
        destroy: function() {
            return this.each(function() {
                $(this).removeData('player');
            });
        },
        add: function(track, autoPlay) {
            /**
             * @track can be a single track object, or a list of track objects
             * A track object is defined like this example:
             * track = {
             *      "_id": "52f24b6b89e9eb1e4aed8c1c",
             *      "bitrate": 320,
             *      "duration": 86,
             *      "frequency": 44100,
             *      "trackno": 1,
             *      "year": 2013,
             *      "last_updated": "2013-04-20T14:24:46.000Z",
             *      "name": "Gift Of Tongues",
             *      "album": "Entities",
             *      "artist": "Pomegranate Tiger",
             *      "genre": "Instrumental Progressice Metal",
             *      "path": "/home/magne/music/Pomegranate Tiger/Entities/01 Gift Of Tongues.mp3"
             * }
             */
            return this.each(function() {
                var $this = $(this), data = $this.data('player'), tracks = $.store('get', 'tracks'),
                    tracklist = [], ind = 0, trackslen = utils.len(tracks), orilen = trackslen;
                if (!!track._id){ // only one track
                    tracklist.push(track);
                } else {
                    tracklist = track;
                }
                for (ind in track){
                    track[ind].uniqid = utils.uniqid('t_');
                    data.uniqidsToBePlayed.push(track[ind].uniqid);
                    $this.trigger('playeradd', track[ind]);
                    $.store('add', track[ind]);
                    if (trackslen === 0 && !data.shuffle){
                        // First track, load it (if not in shuffle mode)
                        $this.player('load', track[ind].uniqid, autoPlay);
                    }
                    trackslen++;
                }
                if (data.shuffle && orilen === 0){
                    // Load a random track
                    $this.player('next');
                }
            });
        },
        load: function(uniqid, autoPlay) {
            var $this = $(this), data = $this.data('player'), tracks = $.store('get', 'tracks');
            if (!!tracks[uniqid]){
                data.currentUniqId = uniqid;
                clearTimeout(data.timer);
                data.timer = setTimeout(function(){
                    data.currentSound = soundManager.createSound({
                        id: 't_'+tracks[data.currentUniqId]._id,
                        url: tracks[data.currentUniqId].url,
                        type: 'audio/mp3',
                        autoLoad: true,
                        autoPlay: !!autoPlay,
                        whileplaying: function(){
                            $this.trigger('playerplaying', this);
                        },
                        onfinish: function(){
                            $this.trigger('playerfinish', this);
                            $this.player('next', true);
                        },
                        onstop: function(){
                            $this.trigger('playerstop', this);
                        },
                        onpause: function(){
                            $this.trigger('playerpause', this);
                        },
                        onplay: function(){
                            $this.trigger('playerplay', this);
                        },
                        onload: function(){
                            $this.trigger('playerload', this);
                        },
                        onresume: function(){
                            $this.trigger('playerresume', this);
                        },
                        volume: $.store('get', 'volume') || 100
                    });
                    $this.trigger('playerbeforeload', tracks[uniqid]);
                }, 200);
            }
            return this;
        },
        togglePlayPause: function() {
            return this.each(function() {
                var $this = $(this), data = $this.data('player');
                if (!!data.currentSound) {
                    $this.trigger('playertoggleplaypause');
                    data.currentSound.togglePause();
                }
            });
        },
        setVolume: function(vol) {
            return this.each(function() {
                var $this = $(this), data = $this.data('player');
                if (!!data.currentSound) {
                    data.currentSound.setVolume(vol);
                }
            });
        },
        _nextUniqId: function() {
            var $this = $(this), data = $this.data('player'), tracks = $.store('get', 'tracks');
            
            if (data.shuffle){
                if (data.loop && data.uniqidsToBePlayed.length === 0){
                    // in loop and the playlist has been finished, so reset
                    data.uniqidsToBePlayed = data.uniqidsAlreadyPlayed;
                }
                var randno = Math.floor(Math.random()*data.uniqidsToBePlayed.length),
                    uniqid = data.uniqidsToBePlayed[randno];
                data.uniqidsAlreadyPlayed.push(uniqid);
                data.uniqidsToBePlayed.splice(randno, 1);
                return uniqid;
            }
            
            if (tracks[data.currentUniqId].next === null && data.loop) {
                return $.store('get', 'head');
            }
            return tracks[data.currentUniqId].next;
        },
        _prevUniqId: function() {
            var $this = $(this), data = $this.data('player'), tracks = $.store('get', 'tracks');
            
            if (data.shuffle){
                if (data.uniqidsAlreadyPlayed.length === 0){
                    return null;
                }
                data.uniqidsToBePlayed.push(data.uniqidsAlreadyPlayed.pop());
                return data.uniqidsToBePlayed[data.uniqidsToBePlayed.length-1];
            }
            
            if (tracks[data.currentUniqId].prev === null && data.loop) {
                return $.store('get', 'tail');
            }
            return tracks[data.currentUniqId].prev;
        },
        _play: function() {
            return this.each(function() {
                var $this = $(this), data = $this.data('player');
                if (!!data.currentSound) {
                    $this.trigger('playerplay');
                    data.currentSound.play();
                }
            });
        },
        play: function(uniqid) {
            return this.each(function() {
                var $this = $(this), data = $this.data('player'), tracks = $.store('get', 'tracks');
                $this.player('_stop');
                if (!uniqid) { // Currently loaded track
                    $this.player('_play');
                } else { // Load another track
                    if (!!tracks[uniqid]){
                        $this.player('load', uniqid, true);
                    }else{
                        $.error('jQuery.player.play: Unknown uniqid "' + uniqid + '".');
                    }
                }
            });
        },
        _stop: function() {
            var $this = $(this), data = $this.data('player');
            if (!!data.currentSound) {
                $this.trigger('playerstop');
                data.currentSound.stop();
            }
        },
        next: function(autoPlay) {
            return this.each(function() {
                var $this = $(this), data = $this.data('player'), uniqid = $this.player('_nextUniqId');
                $this.player('_stop');
                data.uniqidsAlreadyPlayed.push(data.currentUniqId);
                if (uniqid !== null) {
                    $this.trigger('playernext');
                    $this.player('load', uniqid, !!autoPlay);
                }
            });
        },
        prev: function() {
            return this.each(function() {
                var $this = $(this), data = $this.data('player'), uniqid = $this.player('_prevUniqId');
                $this.player('_stop');
                delete data.uniqidsAlreadyPlayed[data.uniqidsAlreadyPlayed.length-1];
                if (uniqid !== null) {
                    $this.trigger('playerprev');
                    $this.player('load', uniqid, true);
                }
            });
        },
        toggleShuffle: function() {
            return this.each(function() {
                var $this = $(this), data = $this.data('player');
                $this.trigger('playertoggleshuffle');
                data.shuffle = !data.shuffle;
                $.store('set', 'shuffle', data.shuffle);
                //clear already played tracks list
                data.uniqidsAlreadyPlayed = [];
            });
        },
        toggleLoop: function() {
            return this.each(function() {
                var $this = $(this), data = $this.data('player');
                $this.trigger('playertoggleloop');
                data.loop = !data.loop;
                $.store('set', 'loop', data.loop);
            });
        }
    };

    $.fn.player = function(method) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('jQuery.player: Method ' + method + ' does not exist');
        }
    };
})(jQuery);