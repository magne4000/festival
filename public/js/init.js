$(document).ready(function() {
    /* Fastsearch */
    $('#search').fastsearch({
        source: "ajax/search/artists",
        recipient: ".search .list-group",
        delay: 300
    });
    
    /* Events */
    $(document).hammer().on('tap', "[data-role='play']", function(e){
        var artist = $(e.currentTarget).data("artist"),
            trackId = $(e.currentTarget).data("trackId"),
            album = $(e.currentTarget).data("album");
        if (!artist && !album){
            //TODO $("#player").player('play', trackId);
        }else{
            // Set in "Now playing" tab
            showNowPlaying(artist, album, trackId, function(){
                if (trackId){
                    // Play
                    //TODO $("#player").player('play', trackId);
                }
            });
        }
    });
    
    $(document).hammer().on('tap', "[data-role='add']", function(e){
        var artist = $(e.currentTarget).data("artist"),
            trackId = $(e.currentTarget).data("trackId"),
            album = $(e.currentTarget).data("album");
        // Set in "Now playing" tab
        addNowPlaying(artist, album, trackId);
    });
    
    $(document).hammer().on('tap', "[data-role='show-tracks']", function(e){
        var artist = $(e.currentTarget).data("artist"),
            album = $(e.currentTarget).data("album");
        showTracks(artist, album);
    });
    
    $(document).hammer().on('tap', "[data-role='show-albums']", function(e){
        var artist = $(e.currentTarget).data("artist");
        if (artist){
            showAlbumsByArtist(artist);
        }
    });
    
    /* Swipe */
    $("body").hammer().on('swipeleft', function(e){
        var current = $(".wrapper:visible");
        if (current.length === 1) { // mobile devices
            var next = current.nextAll(":not(.hidden)").first();
            if (next){
                current.addClass("hidden-xs hidden-sm").removeClass("current left right");
                next.removeClass("hidden-xs hidden-sm").addClass("current left");
            }
        }
    }).on('swiperight', function(e){
        var current = $(".wrapper:visible");
        if (current.length === 1) { // mobile devices
            var prev = current.prevAll(":not(.hidden)").first();
            if (prev){
                current.addClass("hidden-xs hidden-sm").removeClass("current left right");
                prev.removeClass("hidden-xs hidden-sm").addClass("current right");
            }
        }
    });
    
    /* Progress bar */
    $('.progressbar input').slider({
        formater: function(value) {
            return value;
        }
    })
    .removeClass("hidden")
    .on('slide', function(e){
        console.log($(this).slider('getValue'));
        //$(this).slider('setValue', 10)
    });
    
    /*
    // Tooltip
    Opentip.styles.myStyle = {
        extends: "dark",
        background: "#202020",
        borderRadius: 5
    };
    var tooltipBar = new Opentip("#bar", { style: "myStyle", tipJoint: "bottom", offset: [2, 13] });
    var tooltipVol = new Opentip("#volume-max", { style: "myStyle", tipJoint: "right", offset: [10, 0] });
    
    $('#bar').on('mousemove', function(e){
        var txt = '...',
            track = $playlist.playlist('getCurrentTrack');
        if (!!track){
            var cursorPositionRelative = Math.round((e.pageX - $('#bar').offset().left)),
                cursorPosition = Math.round(cursorPositionRelative/$('#bar').width() * (track.duration/1000));
            if (track.readyState == 3){ //loaded/success
                txt = formatDuration(cursorPosition);
            }else if (track.readyState == 2){
                txt = 'Error';
            }else if (track.readyState == 1){
                txt = 'Loading';
            }
        }
        tooltipBar.setContent(txt);
    });
    
    /* Volume *
    $('#volume-max').slider({
        orientation: "vertical",
        range: "min",
        max: 100,
        value: 100,
        create: function( event, ui ) {
            $('#volume-max a').remove();
        },
        slide: function( event, ui ) {
            $player.player('setVolume', $('#volume-max').slider('value'));
        }
    });
    
    var timeoutvolume = null;
    $("#volume-wrapper, #volume").hover(
        function() {
            if (timeoutvolume) {
                clearTimeout(timeoutvolume);
                timeoutvolume = null;
            }
        },
        function() {
            timeoutvolume = setTimeout(function() {
                timeoutvolume = null;
                $player.player('hideVolume');
            }, 800);
        }
    );
    
    $('#volume-max').on('mousemove', function(e){
        var cursorPositionRelative = Math.round((e.pageY - $('#volume-max').offset().top)),
            cursorPosition = 100 - Math.floor((cursorPositionRelative/$('#volume-max').height()) * 100);
        tooltipVol.setContent(cursorPosition);
        /*Position*
        $('.tooltip-volume').position({
            my: "right-15 top+" + (cursorPositionRelative - 8),
            at: "left top",
            of: $("#volume-max"),
            collision: "flipfit"
        });
    });
    
    /* Actions *
    $(document).on('mouseenter mouseleave', '.wrapper li, .album_list_element, #tabs-playlist tr', function(){
        $(this).find('.actionhandler').toggleClass('active_hover');
    });
    
    /* Shortcuts *
    $(document).on('keydown.space', function() {
        $player.player('togglePlayPause');
    });
    $(document).on('keydown.ctrl_right', function() {
        $player.player('next');
    });
    $(document).on('keydown.ctrl_left', function() {
        $player.player('prev');
    });
    */
});
