(function($) {
    var methods = {
        init : function(options) {
            return this.each(function() {
                var $this = $(this), data = $this.data('player');

                // If the plugin hasn't been initialized yet
                if (!data) {
                    $this.data('player', {
                        target : $this,
                        currentId : null, // MongoDB ID (also use as soundManager Sound ID)
                        currentSound : null, // SoundManager object
                        random : options.random || false,
                        loop : options.loop || false,
                        volume : options.volume || 100,
                        timer: null
                    });
                }
                
                $this.trigger('playercreate');
            });
        },
        destroy : function() {
            return this.each(function() {
                $(this).removeData('player');
            });
        },
        _fetch : function() {
            return this.each(function() {
                var $this = $(this), data = $this.data('player'), tracks = $.store('getTracks');
                if (typeof tracks[data.currentId] !== "undefined"){
                    clearTimeout(data.timer);
                    data.timer = setTimeout(function(){
                        data.currentSound = soundManager.createSound({
                            id: data.currentId,
                            url: tracks[data.currentId].url,
                            autoLoad: true,
                            autoPlay: false,
                            whileplaying: function(){
                                $this.trigger('playerplaying', this);
                            },
                            onfinish: function(){
                                $this.trigger('playerfinish', this);
                                $this.player('next');
                            },
                            onload: function(){
                                $this.trigger('playerload', this);
                            },
                            volume: 100
                        });
                        $this.trigger('playerbeforeload', tracks[data.currentId]);
                    }, 200);
                }
            });
        },
        togglePlayPause : function() {
            return this.each(function() {
                var $this = $(this), data = $this.data('player');
                if (!!data.currentSound) {
                    $this.trigger('playertoggleplaypause');
                }
            });
        },
        setVolume : function(vol) {
            return this.each(function() {
                var $this = $(this), data = $this.data('player');
                if (!!data.currentSound) {
                    data.currentSound.setVolume(vol);
                }
            });
        },
        _play : function() {
            return this.each(function() {
                var $this = $(this), data = $this.data('player');
                if (!!data.currentSound) {
                    $this.trigger('playerplay');
                    data.currentSound.play();
                }
            });
        },
        play : function(uniqid) {
            return this.each(function() {
                var $this = $(this), data = $this.data('player');
                $this.player('_stop');
                if (!uniqid) { // Current loaded track
                    $this.player('_play');
                } else { // Load another track
                    data.playlist.playlist('setCurrent', uniqid, function() {
                        $this.player('_play');
                    });
                }
            });
        },
        _stop : function() {
            var $this = $(this), data = $this.data('player'), current = data.playlist
                    .playlist('getCurrentTrack');
            if (!!current) {
                $this.trigger('playerstop');
                current.stop();
            }
        },
        next : function() {
            return this.each(function() {
                var $this = $(this), data = $this.data('player'), uniqid = data.playlist
                        .playlist('getNextUniqid');
                $this.player('_stop');
                if (uniqid !== null) {
                    $this.trigger('playernext');
                    data.playlist.playlist('setCurrent', uniqid,
                        function() {
                            $this.player('play');
                        }
                    );
                }
            });
        },
        prev : function() {
            return this.each(function() {
                var $this = $(this), data = $this.data('player'), uniqid = data.playlist
                        .playlist('getPrevUniqid');
                $this.player('_stop');
                if (uniqid !== null) {
                    $this.trigger('playerprev');
                    data.playlist.playlist('setCurrent', uniqid,
                        function() {
                            $this.player('play');
                        }
                    );
                }
            });
        },
        toggleRandom : function() {
            return this.each(function() {
                var $this = $(this), data = $this.data('player'), ind;
                $this.trigger('playertogglerandom');
                data.random = !data.random;
                $.store('toggleRandom', true);
            });
        },
        toggleLoop : function() {
            return this.each(function() {
                var $this = $(this), data = $this.data('player');
                $this.trigger('playertoggleloop');
                data.loop = !data.loop;
                $.store('toggleLoop', true);
            });
        }
    };

    $.fn.player = function(method) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(
                    arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('jQuery.player: Method ' + method + ' does not exist');
        }
    };
})(jQuery);