$(document).ready(function() {
    var newTrackLoadStart = false,
        newTrackPlayStart = false,
        timeoutVolume = null;
    
    /* Fastsearch */
    $('#search').fastsearch({
        source: "ajax/search/artists",
        recipient: ".search .list-group",
        delay: 300,
        render: Templates.tab.search
    });
    
    /* Fix dropdown showing out of viewport */
    $(document).on('show.bs.dropdown', ".search .dropdown", function(e) {
        var toggle = $(this).find('.dropdown-toggle'),
            menu = $(this).find('.dropdown-menu'),
            menuVisY = $(window).height() - (toggle.offset().top + toggle.height() + menu.height());
        if (menuVisY < 20) {
            menu.css({
                'top': 'auto',
                'bottom': '100%',
            });
        }
    }).on('hidden.bs.dropdown', ".search .dropdown", function(e) {
        var menu = $(this).find('.dropdown-menu');
        menu.css({
            'top': '',
            'bottom': '',
        });
    });
    
    /* Player */
    $("#player").player()
    .on('playerloading', function(e, obj){
        var duration = Math.floor(obj.durationEstimate / 1000);
        $('.progressbar input').data('slider').max = duration;
        setTotalTime(duration);
        if (!newTrackLoadStart) {
            var $this = $(this), data = $this.data('player');
            setTrackInfo(data.currentUniqId);
            setPlayingTrack(data.currentUniqId);
            $('.progressbar input').slider('enable');
            newTrackLoadStart = true;
        }
    })    
    .on('playerload', function(e, obj){
        var duration = Math.floor(obj.duration / 1000);
        $('.progressbar input').data('slider').max = duration;
        setTotalTime(duration);
    })
    .on('playerplaying', function(e, obj){
        if (!newTrackPlayStart) {
            var $this = $(this), data = $this.data('player');
            setTrackInfo(data.currentUniqId);
            newTrackPlayStart = true;
        }
        $('.progressbar input').slider('setValue', obj.position / 1000);
        setElapsedTime(Math.floor(obj.position / 1000));
    })
    .on('playerstop playerfinish', function(e, obj){
        setElapsedTime(0);
        newTrackLoadStart = false;
        newTrackPlayStart = false;
    })
    .on('playerstop playerpause playerfinish', function(e, obj){
        setPlayIcon();
    })
    .on('playerplay playerresume', function(e, obj){
        setPauseIcon();
    });
    
    /* Events */
    $(document).hammer().on('tap', "[data-role='play']", function(e){
        var artist = $(e.currentTarget).data("artist"),
            trackUniqid = $(e.currentTarget).data("trackUniqid"),
            trackId = $(e.currentTarget).data("trackId"),
            album = $(e.currentTarget).data("album");
        if (!artist && !album){
            $("#player").player('play', trackUniqid);
        }else{
            // Set in "Now playing" tab
            showNowPlaying(artist, album, trackId, function(tracks){
                if (tracks){
                    $("#player").player('empty');
                    $("#player").player('add', tracks, true, trackId);
                }
            });
        }
    });
    
    $(document).hammer().on('tap', "[data-role='add']", function(e){
        var artist = $(e.currentTarget).data("artist"),
            trackId = $(e.currentTarget).data("trackId"),
            album = $(e.currentTarget).data("album");
        addNowPlaying(artist, album, trackId, function(tracks){
            if (tracks){
                $("#player").player('add', tracks);
            }
        });
    });
    
    $(document).hammer().on('tap', "[data-role='show-tracks']", function(e){
        var artist = $(e.currentTarget).data("artist"),
            album = $(e.currentTarget).data("album");
        showTracks(artist, album);
    });
    
    $(document).hammer().on('tap', "[data-role='show-albums']", function(e){
        if (!$(e.target).is('.dropdown-toggle') && $(e.target).parents('.dropdown-toggle').length === 0) {
            var artist = $(e.currentTarget).data("artist");
            if (artist){
                showAlbumsByArtist(artist);
            }
        }
    });
    
    $('#player .controls .loop, #player .controls .shuffle').hammer().on('tap', function(e){
        var title = $(this).attr("title"),
            otherTitle = $(this).attr("data-title");
        $(this).attr('title', otherTitle).attr('data-title', title);
    });
    
    $('.control.play').hammer().on('tap', function(e){
        $('#player').player('togglePlayPause');
    });
    
    $('.control.next').hammer().on('tap', function(e){
        $('#player').player('next', true);
    });
    
    $('.control.prev').hammer().on('tap', function(e){
        $('#player').player('prev', true);
    });
    
    $('.control.shuffle').hammer().on('tap', function(e){
        $('#player').player('toggleShuffle');
        $(this).toggleClass("active");
    });
    
    $('.control.loop').hammer().on('tap', function(e){
        $('#player').player('toggleLoop');
        $(this).toggleClass("active");
    });
    
    /* Swipe */
    $("body").hammer().on('swipeleft', function(e){
        showNextPanel();
    }).on('swiperight', function(e){
        showPreviousPanel();
    });
    
    /* Progress bar */
    $('.progressbar input').slider({
        formater: function(value) {
            return utils.format_duration(value);
        }
    })
    .removeClass("hidden")
    .on('slide', function(e){
        var pos = parseInt(e.value, 10) * 1000,
            cur = $("#player").data('player').currentSound;
        if (!!cur && cur.readyState > 2) {
            cur.setPosition(pos);
        }
    });
    
    /* Volume */
    $(".volume-wrapper input").slider()
    .on('slide', function(e){
        var vol = $(".controls .volume");
        $("#player").player('setVolume', e.value);
        if (e.value < 30) {
            if (!vol.hasClass("volume-min")) {
                vol.removeClass("volume-max volume-mid").addClass("volume-min")
            }
        } else if (e.value < 75) {
            if (!vol.hasClass("volume-mid")) {
                vol.removeClass("volume-min volume-max").addClass("volume-mid")
            }
        } else {
            if (!vol.hasClass("volume-max")) {
                vol.removeClass("volume-min volume-mid").addClass("volume-max")
            }
        }
    });
    
    /* Shortcuts */
    $(document).on('keydown', null, 'space', function() {
        $('#player').player('togglePlayPause');
    });
});
