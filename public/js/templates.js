this["Templates"] = this["Templates"] || {};

this["Templates"]["views/index"] = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),debug = locals_.debug,soundmanager = locals_.soundmanager,title = locals_.title,artists = locals_.artists,tracks = locals_.tracks,playing = locals_.playing;
buf.push("<!DOCTYPE html><html lang=\"fr\"><head><meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no\"><link rel=\"shortcut icon\" type=\"image/png\" href=\"images/favicon.png\"><link rel=\"stylesheet\" type=\"text/css\" href=\"stylesheets/bootstrap.min.css\"><link rel=\"stylesheet\" type=\"text/css\" href=\"stylesheets/bootstrap-slider.css\"><link rel=\"stylesheet\" type=\"text/css\" href=\"stylesheets/style.css\">");
if ( debug)
{
buf.push("<script type=\"text/javascript\" src=\"js/modernizr.min.js\"></script><script type=\"text/javascript\" src=\"js/jquery.min.js\"></script><script type=\"text/javascript\" src=\"js/jquery.hammer-full.min.js\"></script><script type=\"text/javascript\" src=\"js/bootstrap.min.js\"></script><script type=\"text/javascript\" src=\"js/bootstrap-slider.js\"></script><script type=\"text/javascript\" src=\"js/jquery.hotkeys.js\"></script><script type=\"text/javascript\" src=\"js/templates.js\"></script><script type=\"text/javascript\" src=\"js/utils.js\"></script><script type=\"text/javascript\" src=\"js/jquery.store.js\"></script><script type=\"text/javascript\" src=\"js/jquery.player.js\"></script><script type=\"text/javascript\" src=\"js/jquery.fastsearch.js\"></script><script type=\"text/javascript\" src=\"js/runtime.js\"></script><script type=\"text/javascript\" src=\"js/views.js\"></script><script type=\"text/javascript\" src=\"js/ajax.js\"></script><script type=\"text/javascript\" src=\"js/init.js\"></script><script type=\"text/javascript\" src=\"js/soundmanager2-jsmin.js\"></script>");
}
else
{
buf.push("<script type=\"text/javascript\" src=\"js/festival.min.js\"></script><script type=\"text/javascript\" src=\"js/soundmanager2-nodebug-jsmin.js\"></script>");
}
buf.push("<script type=\"text/javascript\">soundManager.setup({\n  url: '" + (jade.escape((jade_interp = soundmanager.url) == null ? '' : jade_interp)) + "',\n  flashVersion: '" + (jade.escape((jade_interp = soundmanager.flashVersion) == null ? '' : jade_interp)) + "',\n  useFlashBlock: " + (jade.escape((jade_interp = soundmanager.useFlashBlock) == null ? '' : jade_interp)) + ",\n  useHTML5Audio: " + (jade.escape((jade_interp = soundmanager.useHTML5Audio) == null ? '' : jade_interp)) + ",\n  preferFlash: " + (jade.escape((jade_interp = soundmanager.preferFlash) == null ? '' : jade_interp)) + "\n});</script><!--TODO plugins--><title>" + (jade.escape((jade_interp = title) == null ? '' : jade_interp)) + "</title></head><body><header class=\"container-fluid\"><div id=\"player\"><div class=\"controls\"><a title=\"Play\" href=\"javascript:void(0);\" class=\"btn btn-default control play\"></a><a title=\"Previous track\" href=\"javascript:void(0);\" class=\"btn btn-default control hidden-xs prev\"></a><a title=\"Next track\" href=\"javascript:void(0);\" class=\"btn btn-default control hidden-xs next\"></a></div><div class=\"loader\"><div class=\"info\"><span class=\"elapsed-time\">00:00</span><span class=\"name\">Waiting for a track</span><span class=\"total-time\">00:00</span></div><div class=\"progressbar\"><input data-slider-id=\"progress\" data-slider-handle=\"slim\" data-slider-min=\"0\" data-slider-max=\"1\" data-slider-step=\"1\" data-slider-enabled=\"false\" data-slider-value=\"0\" class=\"hidden\"></div></div><div class=\"controls pull-right\"><a title=\"Show more\" data-title=\"Hide\" href=\"javascript:void(0);\" class=\"btn btn-default control hidden-sm hidden-md hidden-lg showmore\"><span>More</span></a><a title=\"Loop (currently off)\" data-title=\"Loop (currently on)\" href=\"javascript:void(0);\" class=\"btn btn-default control hidden-xs loop\"></a><a title=\"Shuffle (currently off)\" data-title=\"Shuffle (currently on)\" href=\"javascript:void(0);\" class=\"btn btn-default control hidden-xs shuffle\"></a><div class=\"dropdown hidden-xs\"><a title=\"Volume\" data-toggle=\"dropdown\" href=\"javascript:void(0);\" class=\"btn btn-default control volume volume-max\"></a><div class=\"volume-wrapper dropdown-menu\"><input data-slider-min=\"0\" data-slider-max=\"100\" data-slider-step=\"1\" data-slider-value=\"100\" data-slider-orientation=\"vertical\" data-slider-handle=\"slim\" data-slider-tooltip=\"hide\"></div></div></div></div></header><main class=\"container-fluid\"><div class=\"row fill\"><div class=\"wrapper col-xd-12 col-md-3 wrapper-search\"><div class=\"search wrapped\"><div class=\"input-group\"><input id=\"search\" type=\"search\" placeholder=\"Search an artist\" autocomplete=\"off\" class=\"form-control\"><span class=\"input-group-addon\"><span class=\"glyphicon glyphicon-search\"></span></span></div><div class=\"list-group\">");
if ( artists)
{
// iterate artists
;(function(){
  var $$obj = artists;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var artist = $$obj[$index];

buf.push("<div data-role=\"show-albums\"" + (jade.attr("data-artist", "" + (artist.artist) + "", true, true)) + " class=\"list-group-item dropdown\">" + (jade.escape((jade_interp = artist.artist) == null ? '' : jade_interp)) + "<div data-toggle=\"dropdown\" class=\"btn btn-default dropdown-toggle\"></div><ul role=\"menu\" aria-labelledby=\"dLabel\" class=\"dropdown-menu dropdown-menu-right\"><li role=\"presentation\"><a data-role=\"play\"" + (jade.attr("data-artist", "" + (artist.artist) + "", true, true)) + " href=\"#\" role=\"menuitem\" tabindex=\"-1\">Play</a></li><li role=\"presentation\"><a data-role=\"add\"" + (jade.attr("data-artist", "" + (artist.artist) + "", true, true)) + " href=\"#\" role=\"menuitem\" tabindex=\"-1\">Add</a></li></ul></div>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var artist = $$obj[$index];

buf.push("<div data-role=\"show-albums\"" + (jade.attr("data-artist", "" + (artist.artist) + "", true, true)) + " class=\"list-group-item dropdown\">" + (jade.escape((jade_interp = artist.artist) == null ? '' : jade_interp)) + "<div data-toggle=\"dropdown\" class=\"btn btn-default dropdown-toggle\"></div><ul role=\"menu\" aria-labelledby=\"dLabel\" class=\"dropdown-menu dropdown-menu-right\"><li role=\"presentation\"><a data-role=\"play\"" + (jade.attr("data-artist", "" + (artist.artist) + "", true, true)) + " href=\"#\" role=\"menuitem\" tabindex=\"-1\">Play</a></li><li role=\"presentation\"><a data-role=\"add\"" + (jade.attr("data-artist", "" + (artist.artist) + "", true, true)) + " href=\"#\" role=\"menuitem\" tabindex=\"-1\">Add</a></li></ul></div>");
    }

  }
}).call(this);

}
buf.push("</div></div></div><div class=\"wrapper hidden-xs hidden-sm col-xd-12 col-md-6 wrapper-albums\"><div class=\"panel wrapped albums\"><div class=\"panel-body\"></div></div></div><div class=\"wrapper hidden-xs hidden-sm hidden col-xd-12 col-md-6 wrapper-genres\"><div class=\"panel wrapped genres\"><div class=\"panel-body\"></div></div></div><div class=\"wrapper hidden-xs hidden-sm col-xd-12 col-md-3 wrapper-playlists\"><ul class=\"nav nav-tabs playlists-tabs\"><li class=\"playing active\"><a href=\"#playing\" data-toggle=\"tab\">Now playing</a></li><li class=\"selection\"><a href=\"#selection\" data-toggle=\"tab\">Selection</a></li></ul><div class=\"panel playlists\"><div class=\"tab-content\"><div id=\"playing\" class=\"tab-pane active\"><div class=\"list-group\">");
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
buf.push("<a href=\"#\"" + (jade.attr("data-track-id", "" + (track._id) + "", true, true)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, true)) + " data-role=\"play\" class=\"list-group-item track\">" + (jade.escape((jade_interp = track.name) == null ? '' : jade_interp)) + "</a>");
}
else
{
buf.push("<a href=\"#\"" + (jade.attr("data-track-id", "" + (track._id) + "", true, true)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, true)) + " data-role=\"play\"" + (jade.attr("data-artist", "" + (track.artist) + "", true, true)) + (jade.attr("data-album", "" + (track.album) + "", true, true)) + " class=\"list-group-item track\">" + (jade.escape((jade_interp = track.name) == null ? '' : jade_interp)) + "</a>");
}
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var track = $$obj[$index];

if ( playing)
{
buf.push("<a href=\"#\"" + (jade.attr("data-track-id", "" + (track._id) + "", true, true)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, true)) + " data-role=\"play\" class=\"list-group-item track\">" + (jade.escape((jade_interp = track.name) == null ? '' : jade_interp)) + "</a>");
}
else
{
buf.push("<a href=\"#\"" + (jade.attr("data-track-id", "" + (track._id) + "", true, true)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, true)) + " data-role=\"play\"" + (jade.attr("data-artist", "" + (track.artist) + "", true, true)) + (jade.attr("data-album", "" + (track.album) + "", true, true)) + " class=\"list-group-item track\">" + (jade.escape((jade_interp = track.name) == null ? '' : jade_interp)) + "</a>");
}
    }

  }
}).call(this);

}
buf.push("</div></div><div id=\"selection\" class=\"tab-pane\"><div class=\"list-group\">");
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
buf.push("<a href=\"#\"" + (jade.attr("data-track-id", "" + (track._id) + "", true, true)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, true)) + " data-role=\"play\" class=\"list-group-item track\">" + (jade.escape((jade_interp = track.name) == null ? '' : jade_interp)) + "</a>");
}
else
{
buf.push("<a href=\"#\"" + (jade.attr("data-track-id", "" + (track._id) + "", true, true)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, true)) + " data-role=\"play\"" + (jade.attr("data-artist", "" + (track.artist) + "", true, true)) + (jade.attr("data-album", "" + (track.album) + "", true, true)) + " class=\"list-group-item track\">" + (jade.escape((jade_interp = track.name) == null ? '' : jade_interp)) + "</a>");
}
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var track = $$obj[$index];

if ( playing)
{
buf.push("<a href=\"#\"" + (jade.attr("data-track-id", "" + (track._id) + "", true, true)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, true)) + " data-role=\"play\" class=\"list-group-item track\">" + (jade.escape((jade_interp = track.name) == null ? '' : jade_interp)) + "</a>");
}
else
{
buf.push("<a href=\"#\"" + (jade.attr("data-track-id", "" + (track._id) + "", true, true)) + (jade.attr("data-track-uniqid", "" + (track.uniqid) + "", true, true)) + " data-role=\"play\"" + (jade.attr("data-artist", "" + (track.artist) + "", true, true)) + (jade.attr("data-album", "" + (track.album) + "", true, true)) + " class=\"list-group-item track\">" + (jade.escape((jade_interp = track.name) == null ? '' : jade_interp)) + "</a>");
}
    }

  }
}).call(this);

}
buf.push("</div></div></div></div></div></div></main></body></html>");;return buf.join("");
};

this["Templates"]["views/player"] = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div id=\"player\"><div class=\"controls\"><a title=\"Play\" href=\"javascript:void(0);\" class=\"btn btn-default control play\"></a><a title=\"Previous track\" href=\"javascript:void(0);\" class=\"btn btn-default control hidden-xs prev\"></a><a title=\"Next track\" href=\"javascript:void(0);\" class=\"btn btn-default control hidden-xs next\"></a></div><div class=\"loader\"><div class=\"info\"><span class=\"elapsed-time\">00:00</span><span class=\"name\">Waiting for a track</span><span class=\"total-time\">00:00</span></div><div class=\"progressbar\"><input data-slider-id=\"progress\" data-slider-handle=\"slim\" data-slider-min=\"0\" data-slider-max=\"1\" data-slider-step=\"1\" data-slider-enabled=\"false\" data-slider-value=\"0\" class=\"hidden\"/></div></div><div class=\"controls pull-right\"><a title=\"Show more\" data-title=\"Hide\" href=\"javascript:void(0);\" class=\"btn btn-default control hidden-sm hidden-md hidden-lg showmore\"><span>More</span></a><a title=\"Loop (currently off)\" data-title=\"Loop (currently on)\" href=\"javascript:void(0);\" class=\"btn btn-default control hidden-xs loop\"></a><a title=\"Shuffle (currently off)\" data-title=\"Shuffle (currently on)\" href=\"javascript:void(0);\" class=\"btn btn-default control hidden-xs shuffle\"></a><div class=\"dropdown hidden-xs\"><a title=\"Volume\" data-toggle=\"dropdown\" href=\"javascript:void(0);\" class=\"btn btn-default control volume volume-max\"></a><div class=\"volume-wrapper dropdown-menu\"><input data-slider-min=\"0\" data-slider-max=\"100\" data-slider-step=\"1\" data-slider-value=\"100\" data-slider-orientation=\"vertical\" data-slider-handle=\"slim\" data-slider-tooltip=\"hide\"/></div></div></div></div>");;return buf.join("");
};

this["Templates"]["views/tab/albums"] = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),artists = locals_.artists;
buf.push("<ul>");
if ( artists)
{
// iterate artists
;(function(){
  var $$obj = artists;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var artist = $$obj[$index];

buf.push("<li class=\"artist\"><h3>" + (jade.escape(null == (jade_interp = artist.name) ? "" : jade_interp)) + "</h3><ul class=\"list-inline\">");
if ( artist.albums)
{
// iterate artist.albums
;(function(){
  var $$obj = artist.albums;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var album = $$obj[$index];

buf.push("<li class=\"album\"><h5>" + (jade.escape(null == (jade_interp = album.name) ? "" : jade_interp)) + "</h5><div><a href=\"#\" data-role=\"show-tracks\"" + (jade.attr("data-artist", "" + (artist.name) + "", true, false)) + (jade.attr("data-album", "" + (album.name) + "", true, false)) + " class=\"thumb\"><img" + (jade.attr("src", album.albumart, true, false)) + (jade.attr("alt", album.name, true, false)) + " class=\"img-responsive\"/></a><div class=\"btn-group\"><a href=\"#\" data-role=\"play\"" + (jade.attr("data-artist", "" + (artist.name) + "", true, false)) + (jade.attr("data-album", "" + (album.name) + "", true, false)) + " class=\"btn btn-default btn-sm\">Play <span class=\"glyphicon glyphicon-play\"></span></a><a href=\"#\" data-role=\"add\"" + (jade.attr("data-artist", "" + (artist.name) + "", true, false)) + (jade.attr("data-album", "" + (album.name) + "", true, false)) + " class=\"btn btn-default btn-sm\">Add <span class=\"glyphicon glyphicon-plus\"></span></a></div></div></li>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var album = $$obj[$index];

buf.push("<li class=\"album\"><h5>" + (jade.escape(null == (jade_interp = album.name) ? "" : jade_interp)) + "</h5><div><a href=\"#\" data-role=\"show-tracks\"" + (jade.attr("data-artist", "" + (artist.name) + "", true, false)) + (jade.attr("data-album", "" + (album.name) + "", true, false)) + " class=\"thumb\"><img" + (jade.attr("src", album.albumart, true, false)) + (jade.attr("alt", album.name, true, false)) + " class=\"img-responsive\"/></a><div class=\"btn-group\"><a href=\"#\" data-role=\"play\"" + (jade.attr("data-artist", "" + (artist.name) + "", true, false)) + (jade.attr("data-album", "" + (album.name) + "", true, false)) + " class=\"btn btn-default btn-sm\">Play <span class=\"glyphicon glyphicon-play\"></span></a><a href=\"#\" data-role=\"add\"" + (jade.attr("data-artist", "" + (artist.name) + "", true, false)) + (jade.attr("data-album", "" + (album.name) + "", true, false)) + " class=\"btn btn-default btn-sm\">Add <span class=\"glyphicon glyphicon-plus\"></span></a></div></div></li>");
    }

  }
}).call(this);

}
buf.push("</ul></li>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var artist = $$obj[$index];

buf.push("<li class=\"artist\"><h3>" + (jade.escape(null == (jade_interp = artist.name) ? "" : jade_interp)) + "</h3><ul class=\"list-inline\">");
if ( artist.albums)
{
// iterate artist.albums
;(function(){
  var $$obj = artist.albums;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var album = $$obj[$index];

buf.push("<li class=\"album\"><h5>" + (jade.escape(null == (jade_interp = album.name) ? "" : jade_interp)) + "</h5><div><a href=\"#\" data-role=\"show-tracks\"" + (jade.attr("data-artist", "" + (artist.name) + "", true, false)) + (jade.attr("data-album", "" + (album.name) + "", true, false)) + " class=\"thumb\"><img" + (jade.attr("src", album.albumart, true, false)) + (jade.attr("alt", album.name, true, false)) + " class=\"img-responsive\"/></a><div class=\"btn-group\"><a href=\"#\" data-role=\"play\"" + (jade.attr("data-artist", "" + (artist.name) + "", true, false)) + (jade.attr("data-album", "" + (album.name) + "", true, false)) + " class=\"btn btn-default btn-sm\">Play <span class=\"glyphicon glyphicon-play\"></span></a><a href=\"#\" data-role=\"add\"" + (jade.attr("data-artist", "" + (artist.name) + "", true, false)) + (jade.attr("data-album", "" + (album.name) + "", true, false)) + " class=\"btn btn-default btn-sm\">Add <span class=\"glyphicon glyphicon-plus\"></span></a></div></div></li>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var album = $$obj[$index];

buf.push("<li class=\"album\"><h5>" + (jade.escape(null == (jade_interp = album.name) ? "" : jade_interp)) + "</h5><div><a href=\"#\" data-role=\"show-tracks\"" + (jade.attr("data-artist", "" + (artist.name) + "", true, false)) + (jade.attr("data-album", "" + (album.name) + "", true, false)) + " class=\"thumb\"><img" + (jade.attr("src", album.albumart, true, false)) + (jade.attr("alt", album.name, true, false)) + " class=\"img-responsive\"/></a><div class=\"btn-group\"><a href=\"#\" data-role=\"play\"" + (jade.attr("data-artist", "" + (artist.name) + "", true, false)) + (jade.attr("data-album", "" + (album.name) + "", true, false)) + " class=\"btn btn-default btn-sm\">Play <span class=\"glyphicon glyphicon-play\"></span></a><a href=\"#\" data-role=\"add\"" + (jade.attr("data-artist", "" + (artist.name) + "", true, false)) + (jade.attr("data-album", "" + (album.name) + "", true, false)) + " class=\"btn btn-default btn-sm\">Add <span class=\"glyphicon glyphicon-plus\"></span></a></div></div></li>");
    }

  }
}).call(this);

}
buf.push("</ul></li>");
    }

  }
}).call(this);

}
buf.push("</ul>");;return buf.join("");
};

this["Templates"]["views/tab/genres"] = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

;return buf.join("");
};

this["Templates"]["views/tab/playlist"] = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),tracks = locals_.tracks,playing = locals_.playing;
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
buf.push("</div>");;return buf.join("");
};

this["Templates"]["views/tab/search"] = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),artists = locals_.artists;
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

};return buf.join("");
};