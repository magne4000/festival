$(document).ready(function() {
    $tabs = $('#body2_wrapper .pane').tabs();
    
    /* Resizable */
    $('#left_pane').resizable({
        handles: 'e',
        minWidth: 200,
        maxWidth: 600,
        resize: function(event, ui){
            $(this).css({
                'height': '',
                'left': '5px'
            });
            $('#body2').css({
                'padding-left': $(this).width() + 11
            });
        }
    });
    
    $('#right_pane').resizable({
        handles: 'w',
//        minWidth: 200,
        maxWidth: 600,
        resize: function(event, ui){
            $(this).css({
                'height': '',
                'left': '',
                'right': '5px'
            });
            $('#body2').css({
                'padding-right': $(this).width() + 11
            });
        }
    });
    
    /* Fastsearch */
    $('#input_artist').fastsearch({
        source: "ajax/search.php?type=artist",
        minLength: 2,
        recipient: "#left_pane .wrapper",
        delay: 300,
        restoreCallback: function(){loadAjaxMenu();}
    });
    
    /* Recipients */
    var $recipient_body2_wrapper = $("#tabs-albums .container").recipient(),
    $recipient_right_pane = $("#right_pane .wrapper ul").recipient(),
    $left_pane_ul = $('#left_pane .wrapper ul'),
    timer = null;
    
    $left_pane_ul.recipient();
    $left_pane_ul.recipient('addListener', 'artistClick', function(ids){
        var $this = $(this), modified = false;
        $('[data-artist].ui-selected,:data(artist).ui-selected').removeClass('ui-selected');
        $('[data-artist],:data(artist)').each(function(){
            if ($.inArray($(this).data('artist').id, ids) >= 0){
                $(this).addClass('ui-selected');
                modified = true;
            }
        });
        if (modified){
            $this.trigger('selectablestop');
        }
    });
    
    $recipient_body2_wrapper.recipient('addListener', 'artistClicked', function(target){
        $tabs.tabs("option", "active", 0);
        var $this = $(this);
        getList(MODES.ALBUMS_BY_ARTISTS, target, fillAlbumsList, $this);
        
    });
    
    $recipient_body2_wrapper.on('selectablestop', function(){
        var $this = $(this), subelts = $this.find('.album_list_element.ui-selected'), selected;
        clearTimeout(timer);
        if (subelts.size() === 0){
            selected = [$('#left_pane ul .ui-selected')];
            //If no album is selected, trigger an artistClicked event to mimic the default behaviour
            timer = setTimeout(function(){
                $this.trigger('artistClicked', selected);
            }, 100);
        }else{
            selected = [subelts];
            timer = setTimeout(function(){
                $this.trigger('albumClicked', selected);
            }, 100);
        }
    })
    .recipient('addListener', 'albumClick', function(ids){
        var $this = $(this), modified = false;
        $(':data(album).ui-selected').removeClass('ui-selected');
        $(':data(album)').each(function(){
            if ($.inArray($(this).data('album').id, ids) >= 0){
                $(this).addClass('ui-selected');
                modified = true;
            }
        });
        if (modified){
            $this.trigger('selectablestop');
        }
    });
    
    $recipient_right_pane
    .recipient('addListener', 'artistClicked', function(target){
        var $this = $(this);
        getList(MODES.TRACKS_BY_ARTISTS, target, fillTracksList, $this);
    })
    .recipient('addListener', 'albumClicked', function(target){
        var $this = $(this);
        getList(MODES.TRACKS_BY_ALBUMS, target, fillTracksList, $this);
    })
    .recipient('addListener', 'trackClick', function(ids){
        $(':data(track).ui-selected').removeClass('ui-selected');
        $(':data(track)').each(function(){
            var $this = $(this);
            if ($.inArray($this.data('track').id, ids) >= 0){
                $this.addClass('ui-selected');
            }
        });
    });
    
    $('#player').recipient()
    .recipient('addListener', 'playTracks', function(target){
        var ids = [], $target = $(target);
        show_playlist_tab($playlist);
        $target.each(function(){
            ids.push($(this).data('track').id);
        });
        $playlist.playlist('empty');
        getFileInformations({ids : ids}, function(tracks){
            $playlist.playlist('add', tracks, function(){
                $player.player('play');
            });
        });
    })
    .recipient('addListener', 'addTracks', function(target){
        var ids = [], $target = $(target);
        show_playlist_tab($playlist);
        $target.each(function(){
            ids.push($(this).data('track').id);
        });
        getFileInformations({ids : ids}, function(tracks){
            $playlist.playlist('add', tracks);
        });
    });
    
    /* Selectables */
    $left_pane_ul.selectable({ filter: '>li', cancel: '.actionhandler' });
    $recipient_right_pane.selectable({ filter: '>li', cancel: '.actionhandler' });
    $recipient_body2_wrapper.selectable({ filter: '>div', cancel: '.actionhandler' });
    
    $left_pane_ul.on('selectablestop', function(){
        var $this = $(this), selected = [$this.find('.ui-selected')];
        clearTimeout(timer);
        timer = setTimeout(function(){
            $this.trigger('artistClicked', selected);
        }, 100);
    });
    
    $playlist = $('body').playlist();
    $player = $('body').player({
        playlist : $playlist
    });
    
    /* Context menus */
    
    var cmenu = [
        {title: 'Play', cmd: 'playTracks'},
        {title: 'Add to playlist', cmd: 'addTracks'}
    ],
    showEffect = {delay: 100, duration: 1},
    menuPosition = function(event, ui){
        if ($(event.target).data('actionhandler')){
            var actionhandler = $(event.target).data('actionhandler');
            $(event.target).data('actionhandler', false);
            if (actionhandler){
                return {my: "left top", at: "left bottom", of: $(event.target).find('.actionhandler'), collision: "fit"};
            }
        }
        return {my: "left top", at: "center", of: event, collision: "fit"};
    },
    menuPositionTrack = function(event, ui){
        if ($(event.target).data('actionhandler')){
            var actionhandler = $(event.target).data('actionhandler');
            $(event.target).data('actionhandler', false);
            if (actionhandler){
                return {my: "right top", at: "right bottom", of: $(event.target).find('.actionhandler'), collision: "fit"};
            }
        }
        return {my: "left top", at: "center", of: event, collision: "fit"};
    };
    $('#tabs-albums').contextmenu({
        delegate: '.album_list_element',
        menu: cmenu,
        show: showEffect,
        hide: false,
        position: menuPosition,
        select: function(event, ui) {
            $recipient_right_pane.trigger(ui.cmd, ['#right_pane ul li']);
        },
        beforeOpen: function(event, ui){
            var target = $(event.currentTarget);
            if (!target.hasClass('ui-selected')){
                target.siblings('.ui-selected').removeClass('ui-selected');
                target.addClass('ui-selected');
                target.addClass('active');
                target.parent().trigger('selectablestop');
            }
        }
    });
    $('#left_pane').contextmenu({
        delegate: 'li',
        menu: cmenu,
        show: showEffect,
        hide: false,
        position: menuPosition,
        select: function(event, ui) {
            if ($('#tabs-albums').find('.ui-selected')){
                $(document).one('tracklistupdated', function(){
                    $recipient_right_pane.trigger(ui.cmd, ['#right_pane ul li']);
                });
                ui.target.parent().trigger('selectablestop');
            }else{
                $recipient_right_pane.trigger(ui.cmd, ['#right_pane ul li']);
            }
        },
        beforeOpen: function(event, ui){
            if (!ui.target.hasClass('ui-selected')){
                ui.target.siblings('.ui-selected').removeClass('ui-selected');
                ui.target.addClass('ui-selected');
                ui.target.addClass('active');
                ui.target.parent().trigger('selectablestop');
            }
        }
    });
    $('#right_pane').contextmenu({
        delegate: 'li',
        menu: cmenu,
        show: showEffect,
        hide: false,
        position: menuPositionTrack,
        select: function(event, ui) {
            $recipient_right_pane.trigger(ui.cmd, ['#right_pane ul li.ui-selected']);
        },
        beforeOpen: function(event, ui){
            if (!ui.target.hasClass('ui-selected')){
                ui.target.siblings('.ui-selected').removeClass('ui-selected');
                ui.target.addClass('ui-selected');
                ui.target.addClass('active');
                ui.target.parent().trigger('selectablestop');
            }
        }
    });
    $("#tabs-albums,#left_pane,#right_pane").recipient();
    $("#tabs-albums,#left_pane,#right_pane").recipient('addListener', 'tracklistupdated', function(target){
        $(this).contextmenu('enableEntry', 'playTracks', true);
        $(this).contextmenu('enableEntry', 'addTracks', true);
    });
    $("#tabs-albums,#left_pane,#right_pane").recipient('addListener', 'artistClicked albumClicked', function(target){
        $(this).contextmenu('enableEntry', 'playTracks', false);
        $(this).contextmenu('enableEntry', 'addTracks', false);
    });
    
    $(document).one('playlisttabcreated', function(){
        $("#tabs-albums,#left_pane,#right_pane,#tabs-playlist").on('click', '.actionhandler', function(e){
            $(this).parent().data('actionhandler', true);
            $(e.delegateTarget).contextmenu('open', $(this).parent());
        });
        $('#tabs-playlist').contextmenu({
            delegate: 'tbody tr',
            menu: [
                {title: 'Play', cmd: 'play'},
                {title: 'Remove', cmd: 'remove'}
            ],
            show: showEffect,
            hide: false,
            position: menuPosition,
            select: function(event, ui) {
                var trackid = ui.target.parents('tr').attr('id');
                switch(ui.cmd){
                case 'remove':
                    $playlist.playlist('remove', trackid);
                    break;
                case 'play':
                    $player.player('play', trackid);
                    break;
                }
            }
        });
    });
    
    /* Player */
    
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
    
    /* Volume */
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
        /*Position*/
        $('.tooltip-volume').position({
            my: "right-15 top+" + (cursorPositionRelative - 8),
            at: "left top",
            of: $("#volume-max"),
            collision: "flipfit"
        });
    });
    
    /* Actions */
    $(document).on('mouseenter mouseleave', '.wrapper li, .album_list_element, #tabs-playlist tr', function(){
        $(this).find('.actionhandler').toggleClass('active_hover');
    });
    
    /* Shortcuts */
    $(document).on('keydown.space', function() {
        $player.player('togglePlayPause');
    });
    $(document).on('keydown.ctrl_right', function() {
        $player.player('next');
    });
    $(document).on('keydown.ctrl_left', function() {
        $player.player('prev');
    });
});