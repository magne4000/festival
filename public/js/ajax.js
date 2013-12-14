var MODES = {
	TRACKS_BY_ARTISTS : "TRACKS_BY_ARTISTS",
	ALBUMS_BY_ARTISTS : "ALBUMS_BY_ARTISTS",
	TRACKS_BY_ALBUMS : "TRACKS_BY_ALBUMS"
};
var postTimeout = {
    'tracks': null,
    'albums': null
};

function getList(mode, objs, callback, $applyOn){
	var filter, retrieve;
	switch(mode){
		case MODES.TRACKS_BY_ARTISTS:
			retrieve = 'tracks';
			filter = {artist: {$in: []}};
			objs.each(function(){
				filter.artist.$in.push($(this).data('artist').id);
			});
			break;
		case MODES.ALBUMS_BY_ARTISTS:
			retrieve = 'albums';
			filter = {artist: {$in: []}};
			objs.each(function(){
				filter.artist.$in.push($(this).data('artist').id);
			});
			break;
		case MODES.TRACKS_BY_ALBUMS:
			retrieve = 'tracks';
			filter = {album: {$in: []}};
			objs.each(function(){
				filter.album.$in.push($(this).data('album').id);
			});
			break;
		default:
			return false;
	}
	clearTimeout(postTimeout[retrieve]);
	postTimeout[retrieve] = setTimeout(function(){
        $.get('ajax/list/'+retrieve,{
            filters : JSON.stringify(filter)
        }, function(objs){
            $applyOn.empty();
            callback(objs, $applyOn);
        }, "json")
        .fail(function(jqXHR, textStatus){
            console.log(textStatus);
            console.log(jqXHR.responseText);
        });
	}, 200);
}

function getFileInformations(options, callback){
	$.get('ajax/fileinfo', {ids: JSON.stringify(options)}, function(obj){
		console.log(obj);
		callback(obj);
	}, "json")
	.fail(function(jqXHR, textStatus){
		console.log(textStatus);
		console.log(jqXHR.responseText);
	});
}

function getAlbumArt(elt){
	$.get('ajax/getAlbumArt.php', {albumpath:elt.data('album').path}, function(obj){
		if (!!obj.path){
			elt.prepend('<img src="' + obj.path + '" />');
		}
	}, "json")
	.error(function(jqXHR, textStatus){
		console.log(textStatus);
        console.log(jqXHR.responseText);
    });
}