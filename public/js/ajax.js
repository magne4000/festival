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
			filter = [{elements : [], type : 'artist'}];
			objs.each(function(){
				filter[0].elements.push({
					id: $(this).data('artist').id
				});
			});
			break;
		case MODES.ALBUMS_BY_ARTISTS:
			retrieve = 'albums';
			filter = [{elements : [], type : 'artist'}];
			objs.each(function(){
				filter[0].elements.push({
					id: $(this).data('artist').id
				});
			});
			break;
		case MODES.TRACKS_BY_ALBUMS:
			retrieve = 'tracks';
			filter = [{elements : [], type : 'album'}];
			objs.each(function(){
				filter[0].elements.push({
					id: $(this).data('album').id
				});
			});
			break;
		default:
			return false;
	}
	clearTimeout(postTimeout[retrieve]);
	postTimeout[retrieve] = setTimeout(function(){
        $.post('ajax/getJSONlist.php',{
            filters : filter,
            mode : retrieve
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
	$.post('ajax/getFileInformations.php', options, function(obj){
		callback(obj);
	}, "json")
	.fail(function(jqXHR, textStatus){
		console.log(textStatus);
		console.log(jqXHR.responseText);
	});
}

function getAlbumArt(elt){
	$.post('ajax/getAlbumArt.php', {albumpath:elt.data('album').path}, function(obj){
		if (!!obj.path){
			elt.prepend('<img src="' + obj.path + '" />');
		}
	}, "json")
	.error(function(jqXHR, textStatus){
		console.log(textStatus);
        console.log(jqXHR.responseText);
    });
}