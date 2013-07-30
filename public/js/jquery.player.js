(function($) {
    var methods = {
        init : function(options) {
            return this.each(function() {
                var $this = $(this), data = $this.data('player'), loopState;

                // If the plugin hasn't been initialized yet
                if (!data) {
                    $this.data('player', {
                        target : $this,
                        playlist : options.playlist || this.playlist(),
                        volume : options.volume || 100,
                        $play : $(options.playselector || '#play'),
                        $next : $(options.nextselector || '#next'),
                        $prev : $(options.prevselector || '#prev'),
                        $loop : $(options.loopselector || '#loop'),
                        $shuffle : $(options.shuffleselector || '#shuffle'),
                        $volume : $(options.volumeselector || '#volume'),
                        $bar : $(options.barselector || '#bar'),
                        $info : $(options.infoselector || '#info span'),
                        $volumewrapper : $(options.volumewrapperselector || '#volume-wrapper')
                    });

                    data = $this.data('player');
                    data.$play.click(function() {
                        $this.player('togglePlayPause');
                    });
                    data.$next.click(function() {
                        $this.player('next');
                    });
                    data.$prev.click(function() {
                        $this.player('prev');
                    });
                    data.$loop.click(function() {
                        $this.player('toggleLoop');
                    });
                    data.$shuffle.click(function() {
                        $this.player('toggleShuffle');
                    });
                    data.$volume.click(function() {
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
                
                // Bind with playlist events
                $this.recipient();
                $this.recipient('addListener', 'playlistplaying', function(track){
                    data.$bar.slider('value', track.position);
                    $this.find('.elapsed-time').html(formatDuration(track.position/1000));
                }).recipient('addListener', 'playlistload', function(track){
                    $this.find('.total-time').html(formatDuration(track.duration/1000));
                    data.$bar.slider('option', 'max', track.duration);
                });
                
                data.$info.recipient();
                data.$info.recipient('addListener', 'playlistbeforeload', function(track){
                    $(this).attr('title', 'Artist: ' + track.Album.Artist.name + '\nAlbum: ' + track.Album.name + '\nTrack: ' + track.name)
                    .html(track.Album.Artist.name + ' — ' + track.name);
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
            return this
                    .each(function() {
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
            return this
                    .each(function() {
                        var $this = $(this), data = $this.data('player'), current = data.playlist
                                .playlist('getCurrentTrack');
                        if (!!current) {
                            current.setVolume(vol);
                        }
                    });
        },
        _play : function() {
            return this
                    .each(function() {
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
            return this
                    .each(function() {
                        var $this = $(this), data = $this.data('player'), uniqid = data.playlist
                                .playlist('getNextUniqid');
                        $this.player('_stop');
                        if (uniqid !== null) {
                            $this.trigger('playernext');
                            data.playlist.playlist('setCurrent', uniqid,
                                    function() {
                                        $this.player('play');
                                    });
                        }
                    });
        },
        prev : function() {
            return this
                    .each(function() {
                        var $this = $(this), data = $this.data('player'), uniqid = data.playlist
                                .playlist('getPrevUniqid');
                        $this.player('_stop');
                        if (uniqid !== null) {
                            $this.trigger('playerprev');
                            data.playlist.playlist('setCurrent', uniqid,
                                    function() {
                                        $this.player('play');
                                    });
                        }
                    });
        },
        toggleShuffle : function() {
            return this.each(function() {
                var $this = $(this), data = $this.data('player');
                $this.trigger('playertoggleshuffle');
                data.$shuffle.toggleClass('active');
                data.playlist.playlist('toggleShuffle');
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