var postTimeout = {
    tracks: null,
    nowPlaying: null,
    albums: null
};

function setElapsedTime(val){
    $('.elapsed-time').html(utils.format_duration(val));
}

function setTotalTime(val){
    $('.total-time').html(utils.format_duration(val));
}

function showPanel(panel){
    var current = $(".wrapper:visible");
    if (current.length === 1) { // mobile devices
        var prev = current.prevAll(":not(.hidden)"),
            next = current.nextAll(":not(.hidden)");
        if (panel === "next"){
            current.addClass("hidden-xs hidden-sm").removeClass("current left right");
            next.first().removeClass("hidden-xs hidden-sm").addClass("current left");
        }else if (panel === "prev"){
            current.addClass("hidden-xs hidden-sm").removeClass("current left right");
            prev.first().removeClass("hidden-xs hidden-sm").addClass("current right");
        }else{
            if(prev.filter(panel).length > 0){
                current.addClass("hidden-xs hidden-sm").removeClass("current left right");
                $(panel).removeClass("hidden-xs hidden-sm").addClass("current right");
            }else if (next.filter(panel).length > 0){
                current.addClass("hidden-xs hidden-sm").removeClass("current left right");
                $(panel).removeClass("hidden-xs hidden-sm").addClass("current left");
            }
        }
    }
}

function showNextPanel(){
    showPanel("next");
}

function showPreviousPanel(){
    showPanel("prev");
}

function showTracks(artist, album){
    var filter = {artist: artist};
    if (album) {
        filter.album = album;
    }
    clearTimeout(postTimeout.tracks);
    postTimeout.tracks = setTimeout(function(){
        $.get('ajax/list/tracks',{
            filters: JSON.stringify(filter),
            render: true
        }, function(html){
            $("#selection").html(html);
            $(".playlists-tabs .selection a").tab('show');
            showPanel('.wrapper-playlists');
        }, "html")
        .fail(function(jqXHR, textStatus){
            console.log(textStatus);
            console.log(jqXHR.responseText);
        });
    }, 200);
}

function addNowPlaying(artist, album, trackId, callback){
    var filter = {artist: artist};
    if (album) {
        filter.album = album;
    }
    if (!album && !artist){
        filter = {_id: trackId};
    }
    clearTimeout(postTimeout.nowPlaying);
    postTimeout.nowPlaying = setTimeout(function(){
        $.get('ajax/list/tracks',{
            filters: JSON.stringify(filter),
            render: true,
            playing: true
        }, function(html){
            $("#playing .list-group").append($(html).find(".list-group-item"));
            $(".playlists-tabs .playing a").tab('show');
        }, "html")
        .fail(function(jqXHR, textStatus){
            console.log(textStatus);
            console.log(jqXHR.responseText);
        });
        
        if (typeof callback === 'function'){
            $.get('ajax/list/tracks',{
                filters: JSON.stringify(filter)
            }, function(data){
                callback(data);
            }, "json")
            .fail(function(jqXHR, textStatus){
                console.log(textStatus);
                console.log(jqXHR.responseText);
            });
        }
    }, 200);
}

function showNowPlaying(artist, album, trackId, callback){
    var filter = {artist: artist};
    if (album) {
        filter.album = album;
    }
    if (!album && !artist){
        filter = {_id: trackId};
    }
    clearTimeout(postTimeout.nowPlaying);
    postTimeout.nowPlaying = setTimeout(function(){
        $.get('ajax/list/tracks',{
            filters: JSON.stringify(filter),
            render: true,
            playing: true
        }, function(html){
            $("#playing").html(html);
            $(".playlists-tabs .playing a").tab('show');
            showPanel('.wrapper-playlists');
        }, "html")
        .fail(function(jqXHR, textStatus){
            console.log(textStatus);
            console.log(jqXHR.responseText);
        });
        
        if (typeof callback === 'function'){
            $.get('ajax/list/tracks',{
                filters: JSON.stringify(filter)
            }, function(data){
                callback(data);
            }, "json")
            .fail(function(jqXHR, textStatus){
                console.log(textStatus);
                console.log(jqXHR.responseText);
            });
        }
    }, 200);
}

function showAlbums(html){
    $(".albums .panel-body").html(html);
    showPanel('.wrapper-albums');
}

function showAlbumsByArtist(artist){
    var filter = {artist: artist};
    clearTimeout(postTimeout.albums);
    postTimeout.albums = setTimeout(function(){
        $.get('ajax/list/albumsbyartists',{
            filters: JSON.stringify(filter),
            render: true
        }, function(html){
            showAlbums(html);
        }, "html")
        .fail(function(jqXHR, textStatus){
            console.log(textStatus);
            console.log(jqXHR.responseText);
        });
    }, 200);
}