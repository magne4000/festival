(function($) {
    var methods = {
        init : function(options) {
            return this
                    .each(function() {
                        var $this = $(this), data = $this.data('playlist_div');
                        // If the plugin hasn't been initialized yet
                        if (!data) {
                            $this.data('playlist_div', {
                                playlist : options.playlist,
                                currentuniqid : null
                            });
                            data = $this.data('playlist_div');
                        }
                        if ($this.is(':empty')) {
                            $this
                                .html($('<table><thead><tr><th>Nom</th><th>Artiste</th><th>Album</th><th>Année</th><th>Durée</th></tr></thead></table>')
                                .append(
                                    $('<tbody></tbody>')
                                    .sortable({
                                        update : function(event, ui) {
                                            var after;
                                            if (ui.item.index() === 0){
                                                after = null;
                                            }else{
                                                after = ui.item.parent().children(':eq('+(ui.item.index() - 1)+')').attr('id');
                                            }
                                            data.playlist.playlist('move', ui.item.attr('id'), after);
                                        },
                                        handle : '.handle',
                                        axis : 'y'
                                    })
                                )
                            );
                        }
                        data.playlist.playlist('setPlaylistDiv', $this);
                    });
        },
        destroy : function() {
            return this.each(function() {
                var $this = $(this);
                $this.playlist('empty');
                $this.removeData('playlist_div');
            });
        },
        add : function(track, uniqidhead) {
            return this.each(function() {
                var $this = $(this), s = '', elt, end = false, nbtracks = len(track);
                if (!!track.id) {
                    s = $('<tr></tr>')
                        .append('<td><div class="text"><div class="handle"></div>' + getTrackNameWithTrackNumberIfAvailable(track) + '<div class="actionhandler"></div></div></td>')
                        .append('<td>' + track.Album.Artist.name + '</td>')
                        .append('<td>' + track.Album.name + '</td>')
                        .append('<td>' + track.year + '</td>')
                        .append('<td>' + formatDuration(track.duration) + '</td>')
                        .data('track', {id : track.id})
                        .attr('id', track.uniqid);
                    $this.find('tbody').append(s);
                }else{
                    elt = track[uniqidhead];
                    while (!end) {
                        s = $('<tr></tr>')
                        .append('<td><div class="text"><div class="handle"></div>' + getTrackNameWithTrackNumberIfAvailable(elt) + '<div class="actionhandler"></div></div></td>')
                        .append('<td>' + elt.Album.Artist.name + '</td>')
                        .append('<td>' + elt.Album.name + '</td>')
                        .append('<td>' + elt.year + '</td>')
                        .append('<td>' + formatDuration(elt.duration) + '</td>')
                        .data('track', {id : elt.id})
                        .attr('id', elt.uniqid);
                        $this.find('tbody').append(s);
                        nbtracks--;
                        if (elt.next === null || nbtracks === 0){
                            end = true;
                        }else{
                            elt = track[elt.next];
                        }
                    }
                }
            });
        },
        remove : function(uniqid) {
            return this.each(function() {
                $('#'+uniqid).remove();
            });
        },
        empty : function() {
            return this.each(function() {
                $(this).find('tbody').empty();
            });
        },
        setCurrent : function(uniqid) {
            return this.each(function() {
                var $this = $(this), data = $this.data('playlist_div');
                $('#'+data.currentuniqid).css('background-color', '');
                $('#'+uniqid).css('background-color', '#888');
                data.currentuniqid = uniqid;
            });
        }
    };

    $.fn.playlist_div = function(method) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('jQuery.playlist_div: Method ' + method + ' does not exist');
        }
    };
})(jQuery);