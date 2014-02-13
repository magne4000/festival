$(document).ready(function() {
    /* Fastsearch */
    $('#search').fastsearch({
        source: "ajax/search/artists",
        recipient: ".search .list-group",
        delay: 300
    });
    
    /* Events */
    $(document).on('click', "[data-role='play']", function(e){
        var artist = $(e.currentTarget).data("artist");
        if (artist){
            console.log(artist);
        }
    });
    
    $(document).on('click', "[data-role='add']", function(e){
        var artist = $(e.currentTarget).data("artist");
        if (artist){
            console.log(artist);
        }
    });
    
    $(document).on('click', "[data-role='show-tracks']", function(e){
        var artist = $(e.currentTarget).data("artist"),
            album = $(e.currentTarget).data("album");
        showTracks(artist, album);
    });
    
    $(document).on('click', "[data-role='show-albums']", function(e){
        var artist = $(e.currentTarget).data("artist");
        if (artist){
            showAlbumsByArtist(artist);
        }
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
