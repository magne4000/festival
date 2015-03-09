this["Templates"] = this["Templates"] || {};

this["Templates"]["views/index"] = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (debug, soundmanager, title) {
buf.push("<!DOCTYPE html><html lang=\"fr\"><head><meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\"><link rel=\"icon\" type=\"image/png\" href=\"images/favicon.png\"><link rel=\"stylesheet\" type=\"text/css\" href=\"stylesheets/normalize.css\"><link rel=\"stylesheet\" type=\"text/css\" href=\"stylesheets/font-awesome.min.css\"><link rel=\"stylesheet\" type=\"text/css\" href=\"stylesheets/style.css\">");
if ( debug)
{
buf.push("<script type=\"text/javascript\" src=\"js/jquery.min.js\"></script><script type=\"text/javascript\" src=\"js/jquery.hotkeys.js\"></script><script type=\"text/javascript\" src=\"js/templates.js\"></script><script type=\"text/javascript\" src=\"js/utils.js\"></script><script type=\"text/javascript\" src=\"js/jquery.store.js\"></script><script type=\"text/javascript\" src=\"js/jquery.player.js\"></script><script type=\"text/javascript\" src=\"js/runtime.js\"></script><script type=\"text/javascript\" src=\"js/views.js\"></script><script type=\"text/javascript\" src=\"js/ajax.js\"></script><script type=\"text/javascript\" src=\"js/init.js\"></script><script type=\"text/javascript\" src=\"js/soundmanager2-jsmin.js\"></script>");
}
else
{
buf.push("<script type=\"text/javascript\" src=\"js/festival.min.js\"></script><script type=\"text/javascript\" src=\"js/soundmanager2-nodebug-jsmin.js\"></script>");
}
buf.push("<script type=\"text/javascript\">soundManager.setup({\n  url: '" + (jade.escape((jade_interp = soundmanager.url) == null ? '' : jade_interp)) + "',\n  flashVersion: '" + (jade.escape((jade_interp = soundmanager.flashVersion) == null ? '' : jade_interp)) + "',\n  useFlashBlock: " + (jade.escape((jade_interp = soundmanager.useFlashBlock) == null ? '' : jade_interp)) + ",\n  useHTML5Audio: " + (jade.escape((jade_interp = soundmanager.useHTML5Audio) == null ? '' : jade_interp)) + ",\n  preferFlash: " + (jade.escape((jade_interp = soundmanager.preferFlash) == null ? '' : jade_interp)) + "\n});</script><title>" + (jade.escape((jade_interp = title) == null ? '' : jade_interp)) + "</title></head><body><header><div id=\"player\" class=\"player\"><a title=\"Previous track\" href=\"javascript:void(0);\" class=\"control prev\"><i class=\"fa fa-backward fa-2x\"></i></a><a title=\"Play\" href=\"javascript:void(0);\" class=\"control play\"><i class=\"fa fa-play fa-2x\"></i></a><a title=\"Next track\" href=\"javascript:void(0);\" class=\"control next\"><i class=\"fa fa-forward fa-2x\"></i></a><div class=\"panel\"><div class=\"info-panel\"><span class=\"elapsed-time\">00:00</span><span class=\"name\">Waiting for a track</span><span class=\"total-time\">00:00</span></div><div class=\"slider-panel\"><div class=\"slider\"><div class=\"loading\"></div><div class=\"progress\"></div></div></div></div><a title=\"Loop (currently off)\" data-title=\"Loop (currently on)\" href=\"javascript:void(0);\" class=\"control loop\"><i class=\"fa fa-refresh fa-2x\"></i></a><a title=\"Shuffle (currently off)\" data-title=\"Shuffle (currently on)\" href=\"javascript:void(0);\" class=\"control shuffle\"><i class=\"fa fa-random fa-2x\"></i></a></div><!-- TODO volume--><!--  .dropdown.hidden-xs--><!--    a.btn.btn-default.control.volume.volume-max(title='Volume', data-toggle='dropdown', href='javascript:void(0);')--><!--    .volume-wrapper.dropdown-menu--><!--      input(data-slider-min='0', data-slider-max='100', data-slider-step='1', data-slider-value='100', data-slider-orientation='vertical', data-slider-handle='slim', data-slider-tooltip='hide')--><div class=\"toolbar\"><div class=\"search\"><input id=\"search\" type=\"search\" placeholder=\"Search for artist, album or track\"></div><div class=\"displaymode ar\"></div><div class=\"displaymode aral\"></div><div class=\"displaymode araltr\"></div></div></header><main><div class=\"container\"></div><div class=\"queue\"></div></main></body></html>");}.call(this,"debug" in locals_for_with?locals_for_with.debug:typeof debug!=="undefined"?debug:undefined,"soundmanager" in locals_for_with?locals_for_with.soundmanager:typeof soundmanager!=="undefined"?soundmanager:undefined,"title" in locals_for_with?locals_for_with.title:typeof title!=="undefined"?title:undefined));;return buf.join("");
};

this["Templates"]["views/player"] = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div id=\"player\" class=\"player\"><a title=\"Previous track\" href=\"javascript:void(0);\" class=\"control prev\"><i class=\"fa fa-backward fa-2x\"></i></a><a title=\"Play\" href=\"javascript:void(0);\" class=\"control play\"><i class=\"fa fa-play fa-2x\"></i></a><a title=\"Next track\" href=\"javascript:void(0);\" class=\"control next\"><i class=\"fa fa-forward fa-2x\"></i></a><div class=\"panel\"><div class=\"info-panel\"><span class=\"elapsed-time\">00:00</span><span class=\"name\">Waiting for a track</span><span class=\"total-time\">00:00</span></div><div class=\"slider-panel\"><div class=\"slider\"><div class=\"loading\"></div><div class=\"progress\"></div></div></div></div><a title=\"Loop (currently off)\" data-title=\"Loop (currently on)\" href=\"javascript:void(0);\" class=\"control loop\"><i class=\"fa fa-refresh fa-2x\"></i></a><a title=\"Shuffle (currently off)\" data-title=\"Shuffle (currently on)\" href=\"javascript:void(0);\" class=\"control shuffle\"><i class=\"fa fa-random fa-2x\"></i></a></div><!-- TODO volume--><!--  .dropdown.hidden-xs--><!--    a.btn.btn-default.control.volume.volume-max(title='Volume', data-toggle='dropdown', href='javascript:void(0);')--><!--    .volume-wrapper.dropdown-menu--><!--      input(data-slider-min='0', data-slider-max='100', data-slider-step='1', data-slider-value='100', data-slider-orientation='vertical', data-slider-handle='slim', data-slider-tooltip='hide')-->");;return buf.join("");
};

this["Templates"]["views/tab/albums"] = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (albums, undefined) {
if ( albums)
{
// iterate albums
;(function(){
  var $$obj = albums;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var album = $$obj[$index];

buf.push("<div" + (jade.attr("data-album", album.album, true, false)) + (jade.cls(['album',album.tracks?"":"notracks"], [null,true])) + "><h4 data-role=\"show-tracks\">" + (jade.escape(null == (jade_interp = album.album) ? "" : jade_interp)) + "</h4><div class=\"album-container\"><img" + (jade.attr("src", album.albumart, true, false)) + (jade.attr("alt", album.name, true, false)) + "/><div class=\"tracks\">");
if ( album.tracks)
{
// iterate album.tracks
;(function(){
  var $$obj = album.tracks;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var track = $$obj[$index];

buf.push("<div" + (jade.attr("data-track-id", "" + (track._id) + "", true, false)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, false)) + " data-role=\"play\" class=\"track\"><span>" + (jade.escape(null == (jade_interp = track.trackno) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.name) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.duration) ? "" : jade_interp)) + "</span></div>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var track = $$obj[$index];

buf.push("<div" + (jade.attr("data-track-id", "" + (track._id) + "", true, false)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, false)) + " data-role=\"play\" class=\"track\"><span>" + (jade.escape(null == (jade_interp = track.trackno) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.name) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.duration) ? "" : jade_interp)) + "</span></div>");
    }

  }
}).call(this);

}
buf.push("</div></div></div>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var album = $$obj[$index];

buf.push("<div" + (jade.attr("data-album", album.album, true, false)) + (jade.cls(['album',album.tracks?"":"notracks"], [null,true])) + "><h4 data-role=\"show-tracks\">" + (jade.escape(null == (jade_interp = album.album) ? "" : jade_interp)) + "</h4><div class=\"album-container\"><img" + (jade.attr("src", album.albumart, true, false)) + (jade.attr("alt", album.name, true, false)) + "/><div class=\"tracks\">");
if ( album.tracks)
{
// iterate album.tracks
;(function(){
  var $$obj = album.tracks;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var track = $$obj[$index];

buf.push("<div" + (jade.attr("data-track-id", "" + (track._id) + "", true, false)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, false)) + " data-role=\"play\" class=\"track\"><span>" + (jade.escape(null == (jade_interp = track.trackno) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.name) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.duration) ? "" : jade_interp)) + "</span></div>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var track = $$obj[$index];

buf.push("<div" + (jade.attr("data-track-id", "" + (track._id) + "", true, false)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, false)) + " data-role=\"play\" class=\"track\"><span>" + (jade.escape(null == (jade_interp = track.trackno) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.name) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.duration) ? "" : jade_interp)) + "</span></div>");
    }

  }
}).call(this);

}
buf.push("</div></div></div>");
    }

  }
}).call(this);

}}.call(this,"albums" in locals_for_with?locals_for_with.albums:typeof albums!=="undefined"?albums:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
};

this["Templates"]["views/tab/artists"] = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (artists, undefined) {
if ( artists)
{
buf.push("<div class=\"artists\">");
// iterate artists
;(function(){
  var $$obj = artists;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var artist = $$obj[$index];

buf.push("<div" + (jade.attr("data-artist", artist.artist, true, false)) + " class=\"artist\"><h3 data-role=\"show-albums\">" + (jade.escape(null == (jade_interp = artist.artist) ? "" : jade_interp)) + "</h3><div class=\"albums\">");
if ( artist.albums)
{
// iterate artist.albums
;(function(){
  var $$obj = artist.albums;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var album = $$obj[$index];

buf.push("<div" + (jade.attr("data-album", album.album, true, false)) + (jade.cls(['album',album.tracks?"":"notracks"], [null,true])) + "><h4 data-role=\"show-tracks\">" + (jade.escape(null == (jade_interp = album.album) ? "" : jade_interp)) + "</h4><div class=\"album-container\"><img" + (jade.attr("src", album.albumart, true, false)) + (jade.attr("alt", album.name, true, false)) + "/><div class=\"tracks\">");
if ( album.tracks)
{
// iterate album.tracks
;(function(){
  var $$obj = album.tracks;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var track = $$obj[$index];

buf.push("<div" + (jade.attr("data-track-id", "" + (track._id) + "", true, false)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, false)) + " data-role=\"play\" class=\"track\"><span>" + (jade.escape(null == (jade_interp = track.trackno) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.name) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.duration) ? "" : jade_interp)) + "</span></div>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var track = $$obj[$index];

buf.push("<div" + (jade.attr("data-track-id", "" + (track._id) + "", true, false)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, false)) + " data-role=\"play\" class=\"track\"><span>" + (jade.escape(null == (jade_interp = track.trackno) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.name) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.duration) ? "" : jade_interp)) + "</span></div>");
    }

  }
}).call(this);

}
buf.push("</div></div></div>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var album = $$obj[$index];

buf.push("<div" + (jade.attr("data-album", album.album, true, false)) + (jade.cls(['album',album.tracks?"":"notracks"], [null,true])) + "><h4 data-role=\"show-tracks\">" + (jade.escape(null == (jade_interp = album.album) ? "" : jade_interp)) + "</h4><div class=\"album-container\"><img" + (jade.attr("src", album.albumart, true, false)) + (jade.attr("alt", album.name, true, false)) + "/><div class=\"tracks\">");
if ( album.tracks)
{
// iterate album.tracks
;(function(){
  var $$obj = album.tracks;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var track = $$obj[$index];

buf.push("<div" + (jade.attr("data-track-id", "" + (track._id) + "", true, false)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, false)) + " data-role=\"play\" class=\"track\"><span>" + (jade.escape(null == (jade_interp = track.trackno) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.name) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.duration) ? "" : jade_interp)) + "</span></div>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var track = $$obj[$index];

buf.push("<div" + (jade.attr("data-track-id", "" + (track._id) + "", true, false)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, false)) + " data-role=\"play\" class=\"track\"><span>" + (jade.escape(null == (jade_interp = track.trackno) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.name) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.duration) ? "" : jade_interp)) + "</span></div>");
    }

  }
}).call(this);

}
buf.push("</div></div></div>");
    }

  }
}).call(this);

}
buf.push("</div></div>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var artist = $$obj[$index];

buf.push("<div" + (jade.attr("data-artist", artist.artist, true, false)) + " class=\"artist\"><h3 data-role=\"show-albums\">" + (jade.escape(null == (jade_interp = artist.artist) ? "" : jade_interp)) + "</h3><div class=\"albums\">");
if ( artist.albums)
{
// iterate artist.albums
;(function(){
  var $$obj = artist.albums;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var album = $$obj[$index];

buf.push("<div" + (jade.attr("data-album", album.album, true, false)) + (jade.cls(['album',album.tracks?"":"notracks"], [null,true])) + "><h4 data-role=\"show-tracks\">" + (jade.escape(null == (jade_interp = album.album) ? "" : jade_interp)) + "</h4><div class=\"album-container\"><img" + (jade.attr("src", album.albumart, true, false)) + (jade.attr("alt", album.name, true, false)) + "/><div class=\"tracks\">");
if ( album.tracks)
{
// iterate album.tracks
;(function(){
  var $$obj = album.tracks;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var track = $$obj[$index];

buf.push("<div" + (jade.attr("data-track-id", "" + (track._id) + "", true, false)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, false)) + " data-role=\"play\" class=\"track\"><span>" + (jade.escape(null == (jade_interp = track.trackno) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.name) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.duration) ? "" : jade_interp)) + "</span></div>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var track = $$obj[$index];

buf.push("<div" + (jade.attr("data-track-id", "" + (track._id) + "", true, false)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, false)) + " data-role=\"play\" class=\"track\"><span>" + (jade.escape(null == (jade_interp = track.trackno) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.name) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.duration) ? "" : jade_interp)) + "</span></div>");
    }

  }
}).call(this);

}
buf.push("</div></div></div>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var album = $$obj[$index];

buf.push("<div" + (jade.attr("data-album", album.album, true, false)) + (jade.cls(['album',album.tracks?"":"notracks"], [null,true])) + "><h4 data-role=\"show-tracks\">" + (jade.escape(null == (jade_interp = album.album) ? "" : jade_interp)) + "</h4><div class=\"album-container\"><img" + (jade.attr("src", album.albumart, true, false)) + (jade.attr("alt", album.name, true, false)) + "/><div class=\"tracks\">");
if ( album.tracks)
{
// iterate album.tracks
;(function(){
  var $$obj = album.tracks;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var track = $$obj[$index];

buf.push("<div" + (jade.attr("data-track-id", "" + (track._id) + "", true, false)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, false)) + " data-role=\"play\" class=\"track\"><span>" + (jade.escape(null == (jade_interp = track.trackno) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.name) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.duration) ? "" : jade_interp)) + "</span></div>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var track = $$obj[$index];

buf.push("<div" + (jade.attr("data-track-id", "" + (track._id) + "", true, false)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, false)) + " data-role=\"play\" class=\"track\"><span>" + (jade.escape(null == (jade_interp = track.trackno) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.name) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.duration) ? "" : jade_interp)) + "</span></div>");
    }

  }
}).call(this);

}
buf.push("</div></div></div>");
    }

  }
}).call(this);

}
buf.push("</div></div>");
    }

  }
}).call(this);

buf.push("</div>");
}}.call(this,"artists" in locals_for_with?locals_for_with.artists:typeof artists!=="undefined"?artists:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
};

this["Templates"]["views/tab/playlist"] = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (playing, tracks, undefined) {
buf.push("<div class=\"list-group\">");
if ( tracks)
{
// iterate tracks
;(function(){
  var $$obj = tracks;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var track = $$obj[$index];

if ( playing)
{
buf.push("<a href=\"#\"" + (jade.attr("data-track-id", "" + (track._id) + "", true, false)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, false)) + " data-role=\"play\" class=\"list-group-item track\">" + (jade.escape((jade_interp = track.name) == null ? '' : jade_interp)) + "</a>");
}
else
{
buf.push("<a href=\"#\"" + (jade.attr("data-track-id", "" + (track._id) + "", true, false)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, false)) + " data-role=\"play\"" + (jade.attr("data-artist", "" + (track.artist) + "", true, false)) + (jade.attr("data-album", "" + (track.album) + "", true, false)) + " class=\"list-group-item track\">" + (jade.escape((jade_interp = track.name) == null ? '' : jade_interp)) + "</a>");
}
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var track = $$obj[$index];

if ( playing)
{
buf.push("<a href=\"#\"" + (jade.attr("data-track-id", "" + (track._id) + "", true, false)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, false)) + " data-role=\"play\" class=\"list-group-item track\">" + (jade.escape((jade_interp = track.name) == null ? '' : jade_interp)) + "</a>");
}
else
{
buf.push("<a href=\"#\"" + (jade.attr("data-track-id", "" + (track._id) + "", true, false)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, false)) + " data-role=\"play\"" + (jade.attr("data-artist", "" + (track.artist) + "", true, false)) + (jade.attr("data-album", "" + (track.album) + "", true, false)) + " class=\"list-group-item track\">" + (jade.escape((jade_interp = track.name) == null ? '' : jade_interp)) + "</a>");
}
    }

  }
}).call(this);

}
buf.push("</div>");}.call(this,"playing" in locals_for_with?locals_for_with.playing:typeof playing!=="undefined"?playing:undefined,"tracks" in locals_for_with?locals_for_with.tracks:typeof tracks!=="undefined"?tracks:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
};

this["Templates"]["views/tab/search"] = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (artists, undefined) {
if ( artists)
{
// iterate artists
;(function(){
  var $$obj = artists;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var artist = $$obj[$index];

buf.push("<div data-role=\"show-albums\"" + (jade.attr("data-artist", "" + (artist.artist) + "", true, false)) + " class=\"list-group-item dropdown\">" + (jade.escape((jade_interp = artist.artist) == null ? '' : jade_interp)) + "<div data-toggle=\"dropdown\" class=\"btn btn-default dropdown-toggle\"></div><ul role=\"menu\" aria-labelledby=\"dLabel\" class=\"dropdown-menu dropdown-menu-right\"><li role=\"presentation\"><a data-role=\"play\"" + (jade.attr("data-artist", "" + (artist.artist) + "", true, false)) + " href=\"#\" role=\"menuitem\" tabindex=\"-1\">Play</a></li><li role=\"presentation\"><a data-role=\"add\"" + (jade.attr("data-artist", "" + (artist.artist) + "", true, false)) + " href=\"#\" role=\"menuitem\" tabindex=\"-1\">Add</a></li></ul></div>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var artist = $$obj[$index];

buf.push("<div data-role=\"show-albums\"" + (jade.attr("data-artist", "" + (artist.artist) + "", true, false)) + " class=\"list-group-item dropdown\">" + (jade.escape((jade_interp = artist.artist) == null ? '' : jade_interp)) + "<div data-toggle=\"dropdown\" class=\"btn btn-default dropdown-toggle\"></div><ul role=\"menu\" aria-labelledby=\"dLabel\" class=\"dropdown-menu dropdown-menu-right\"><li role=\"presentation\"><a data-role=\"play\"" + (jade.attr("data-artist", "" + (artist.artist) + "", true, false)) + " href=\"#\" role=\"menuitem\" tabindex=\"-1\">Play</a></li><li role=\"presentation\"><a data-role=\"add\"" + (jade.attr("data-artist", "" + (artist.artist) + "", true, false)) + " href=\"#\" role=\"menuitem\" tabindex=\"-1\">Add</a></li></ul></div>");
    }

  }
}).call(this);

}}.call(this,"artists" in locals_for_with?locals_for_with.artists:typeof artists!=="undefined"?artists:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
};

this["Templates"]["views/tab/tracks"] = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (tracks, undefined) {
if ( tracks)
{
// iterate tracks
;(function(){
  var $$obj = tracks;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var track = $$obj[$index];

buf.push("<div" + (jade.attr("data-track-id", "" + (track._id) + "", true, false)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, false)) + " data-role=\"play\" class=\"track\"><span>" + (jade.escape(null == (jade_interp = track.trackno) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.name) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.duration) ? "" : jade_interp)) + "</span></div>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var track = $$obj[$index];

buf.push("<div" + (jade.attr("data-track-id", "" + (track._id) + "", true, false)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, false)) + " data-role=\"play\" class=\"track\"><span>" + (jade.escape(null == (jade_interp = track.trackno) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.name) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = track.duration) ? "" : jade_interp)) + "</span></div>");
    }

  }
}).call(this);

}}.call(this,"tracks" in locals_for_with?locals_for_with.tracks:typeof tracks!=="undefined"?tracks:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
};