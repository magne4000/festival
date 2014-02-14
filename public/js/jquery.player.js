(function($) {
    var methods = {
        init : function(options) {
            return this.each(function() {
                var $this = $(this), data = $this.data('player'), loopState;

                // If the plugin hasn't been initialized yet
                if (!data) {
                    $this.data('player', {
                        target : $this,
                        volume : options.volume || 100,
                        $play : $(options.playselector || '.play'),
                        $next : $(options.nextselector || '.next'),
                        $prev : $(options.prevselector || '.prev'),
                        $loop : $(options.loopselector || '.loop'),
                        $random : $(options.randomselector || '.random'),
                        $volume : $(options.volumeselector || '.volume'),
                        $bar : $(options.barselector || '.bar'),
                        $info : $(options.infoselector || '#info span'),
                        $volumewrapper : $(options.volumewrapperselector || '#volume-wrapper')
                    });

                    data = $this.data('player');
                    data.$play.on('tap', function() {
                        $this.player('togglePlayPause');
                    });
                    data.$next.on('tap', function() {
                        $this.player('next');
                    });
                    data.$prev.on('tap', function() {
                        $this.player('prev');
                    });
                    data.$loop.on('tap', function() {
                        $this.player('toggleLoop');
                    });
                    data.$random.on('tap', function() {
                        $this.player('toggleRandom');
                    });
                    data.$volume.on('tap', function() {
                        $this.player('toggleVolume');
                    });

                    loopState = data.playlist.playlist('getLoopState');
                    if (loopState) {
                        data.$loop.toggleClass('active');
                    }
                }
                
                //Playing progress bar
                data.$bar.slider({
                    range : "min",
                    create : function(event, ui) {
                        data.$bar.find('a').remove();
                    },
                    slide : function(event, ui) {
                        var track = data.playlist.playlist('getCurrentTrack');
                        if (!!track && track.readyState > 2) {
                            track.setPosition(ui.value);
                        }
                    }
                });
                
                // Info bar
                $(document).on('playlistbeforeload', function(track){
                    $this.data.$info.attr('title', 'Artist: ' + track.artist + '\nAlbum: ' + track.album + '\nTrack: ' + track.name)
                    .html(track.artist + ' — ' + track.album + ' — ' + track.name);
                });
                
                $this.trigger('playercreate');
            });
        },
        destroy : function() {
            return this.each(function() {
                var $this = $(this);
                $this.removeData('player');
            });
        },
        togglePlayPause : function() {
            return this.each(function() {
                var $this = $(this), data = $this.data('player'), current = data.playlist
                        .playlist('getCurrentTrack');
                if (!!current) {
                    $this.trigger('playertoggleplaypause');
                    current.togglePause();
                    data.$play.toggleClass('play pause');
                }
            });
        },
        setVolume : function(vol) {
            return this.each(function() {
                var $this = $(this), data = $this.data('player'), current = data.playlist
                        .playlist('getCurrentTrack');
                if (!!current) {
                    current.setVolume(vol);
                }
            });
        },
        _play : function() {
            return this.each(function() {
                var $this = $(this), data = $this.data('player'), current = data.playlist
                        .playlist('getCurrentTrack');
                if (!!current) {
                    $this.trigger('playerplay');
                    current.play();
                    data.$play.removeClass('play');
                    data.$play.addClass('pause');
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
                data.$play.removeClass('pause');
                data.$play.addClass('play');
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
                var $this = $(this), data = $this.data('player');
                $this.trigger('playertogglerandom');
                data.$random.toggleClass('active');
                data.playlist.playlist('toggleRandom');
            });
        },
        toggleLoop : function() {
            return this.each(function() {
                var $this = $(this), data = $this.data('player');
                $this.trigger('playertoggleloop');
                data.$loop.toggleClass('active');
                data.playlist.playlist('toggleLoop');
            });
        },
        toggleVolume : function() {
            return this.each(function() {
                var $this = $(this), data = $this.data('player');
                $this.trigger('playertogglevolume');
                data.$volume.toggleClass('active');
                data.$volumewrapper.toggleClass('active');
            });
        },
        hideVolume : function() {
            return this.each(function() {
                var $this = $(this), data = $this.data('player');
                $this.trigger('playerhidevolume');
                data.$volume.removeClass('active');
                data.$volumewrapper.removeClass('active');
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