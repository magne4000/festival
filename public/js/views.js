var postTimeout = {
    tracks: null,
    albums: null
};

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