var postTimeout = {
    tracks: null,
    nowPlaying: null,
    albums: null
};

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
        }, "html")
        .fail(function(jqXHR, textStatus){
            console.log(textStatus);
            console.log(jqXHR.responseText);
        });
    }, 200);
}

function addNowPlaying(artist, album, trackId){
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
            if (typeof callback === 'function'){
                callback();
            }
        }, "html")
        .fail(function(jqXHR, textStatus){
            console.log(textStatus);
            console.log(jqXHR.responseText);
        });
    }, 200);
}

function showAlbums(html){
    $(".albums .panel-body").html(html);
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