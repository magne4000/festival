/* global Vue */
/* global festival */
/* global Services */
/* global Views */
/* global Filters */

var FestivalComponents = {};

Vue.component('f-audio-effect', {
  template: '<ul class="audioeffect"><li></li><li></li><li></li><li></li><li></li></ul>'
});

FestivalComponents.Container = Vue.component('f-container', {
  data: function() {
    return {
      shared: festival.state
    };
  },
  template: '<div class="container">' +
    '<div v-show="showDefaultMessage()" class="noresult">No result matching the search criteria.</div>' +
    '<template v-if="shared.artists.length">' +
    '<h3 class="search-title">Artists</h3>' +
    '<f-artists :artists="shared.artists" :selected-artist="shared.selectedArtist"></f-artists>' +
    '</template>' +
    '<h3 class="search-title" v-show="shared.selectedArtist.albums ? shared.selectedArtist.albums.length : shared.albums.length">Albums</h3>' +
    '<f-albums :albums="shared.selectedArtist.albums ? shared.selectedArtist.albums : shared.albums"></f-albums>' +
    '<h3 class="search-title" v-show="shared.tracks.length">Tracks</h3>' +
    '<div class="tracks well hoverable">' +
      '<f-track-search v-for="track in shared.tracks" :track="track" :key="track.id"></f-track-search>' +
    '</div>' +
  '<div>',
  methods: {
    showDefaultMessage: function() {
      return !(this.shared.artists.length || this.shared.albums.length || this.shared.tracks.length || (this.shared.selectedArtist.albums && this.shared.selectedArtist.albums.length));
    }
  }
});

FestivalComponents.Artists = Vue.component('f-artists', {
  data: function() {
    return {
      shared: festival.state,
      loading: false
    };
  },
  props: ['artists', 'selectedArtist'],
  template: '<infinite-scroll :infinite-scroll-callback="pageArtists" :infinite-scroll-immediate-check="true" :infinite-scroll-distance="600">' +
    '<div v-show="shared.loading.artists" class="signal"></div>' +
    '<f-artist :artist="artist" :selected-artist="selectedArtist" v-for="artist in artists" :key="artist.id"></f-artist>' +
  '</infinite-scroll>',
  methods: {
    pageArtists: function() {
      // Here nextTick allow all other events like 'create' on components
      // to be fired before
      Vue.nextTick(Services.displayMode.call.bind(Services.displayMode));
    }
  }
});

FestivalComponents.Artist = Vue.component('f-artist', {
  data: function() {
    return {
      config: festival.config,
    };
  },
  props: ['artist', 'selectedArtist'],
  template: '<div class="artist well hoverable" :class="{selected: artist.id == selectedArtist.id}" @click="toggleArtistSelection();loadAlbumsAndTracks(false)">' +
    '<a :name="\'ar_\'+artist.id" class="anchor"></a>' +
    '<div class="art-container">' +
      '<img v-lazy="\'artistart/\'+artist.id" :alt="artist.name" src="static/images/nocover.png">' +
      '<div class="art-overlay">' +
        '<div class="controls">' +
          '<div title="Play all albums" @click="empty();loadAlbumsAndTracksAndAdd(true)" class="control">' +
            '<i class="material-icons">play_arrow</i>' +
          '</div>' +
          '<div title="Add albums to queue" @click="loadAlbumsAndTracksAndAdd(false)" class="control">' +
            '<i class="material-icons">add</i>' +
          '</div>' +
          '<a v-if="config.showdlbtn" title="Download all albums" :href="download()" class="control" download>' +
            '<i class="material-icons">file_download</i>' +
          '</a>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="heading">' +
      '<h3>{{artist.name ? artist.name : "Unknown"}}</h3>' +
    '</div>' +
  '</div>',
  methods: {
    empty: Services.playlist.empty.bind(Services.playlist),
    download: function() {
      return 'download/artist/' + this.artist.id + '?type=' + Services.displayMode.type();
    },
    toggleArtistSelection: function() {
      Services.Router.selectArtist(this.selectedArtist === this.artist ? void 0 : this.artist.id);
    },
    loadAlbumsAndTracks: function(callback) {
      var $this = this;
      if (!this.artist.albums) {
        var filter = {artist: this.artist.id};
        var params = {
          flat: false,
          type: Services.displayMode.type()
        };
        festival.state.loading.albums = true;
        Services.ajax.tracks(filter, params).done(function(data, status) {
          festival.state.loading.albums = false;
          $this.artist.albums = data.data[0].albums;
          if (typeof callback === "function") callback($this.artist);
        }).fail(function(){
          festival.state.loading.albums = false;
        });
      } else if (typeof callback === "function") {
        setTimeout(function() {
          callback($this.artist);
        }, 0);
      }
    },
    loadAlbumsAndTracksAndAdd: function(autoplay) {
      this.loadAlbumsAndTracks(function(artist1) {
        if (artist1.albums) {
          for (var i=0; i<artist1.albums.length; i++) {
            Views.player.$emit('add', artist1.albums[i].tracks, autoplay);
            autoplay = false;
          }
        }
      });
    }
  }
});

FestivalComponents.Albums = Vue.component('f-albums', {
  data: function() {
    return {
      shared: festival.state,
      loading: false
    };
  },
  props: ['artist', 'albums'],
  template: '<div class="albums" is="transition-group">' +
    '<div v-show="shared.loading.albums" key="loading" class="signal"></div>' +
    '<f-album-with-tracks v-for="album in albums" :album="album" :artist="artist" :key="album.id" @loading="onLoading"></f-album-with-tracks>' +
  '</div>',
  methods: {
    onLoading: function(bool) {
      this.loading = bool;
    }
  }
});

FestivalComponents.AlbumWithTracks = Vue.component('f-album-with-tracks', {
  data: function() {
    return {
      config: festival.config,
    };
  },
  props: ['album', 'artist'],
  template: '<div class="album well hoverable">' +
    '<div class="album-info">' +
      '<div class="art-container">' +
        '<img v-lazy="\'albumart/\'+album.id" :alt="album.name" src="static/images/nocover.png">' +
        '<div class="art-overlay">' +
          '<div class="controls">' +
            '<div title="Play tracks" @click="empty();loadTracksAndAdd(true)" class="control">' +
              '<i class="material-icons">play_arrow</i>' +
            '</div>' +
            '<div title="Add tracks to queue" @click="loadTracksAndAdd(false)" class="control">' +
              '<i class="material-icons">add</i>' +
            '</div>' +
            '<a v-if="config.showdlbtn" title="Download album" :href="download()" class="control" download>' +
              '<i class="material-icons">file_download</i>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<h4 class="album-name">' +
        '{{album.name}}<span v-if="album.year" class="year">({{album.year}})</span>' +
      '</h4>' +
      '<h5 v-if="album.artist" class="artist-name">' +
        '{{album.artist.name}}' +
      '</h5>' +
    '</div>' +
    '<div class="tracks">' +
      '<f-track v-for="track in album.tracks" :track="track" :album="album" :key="track.id"></f-track>' +
    '</div>' +
  '</div>',
  methods: {
    empty: function() {
      Views.player.$emit('empty');
    },
    download: function() {
      return 'download/album/' + this.album.id + '?type=' + Services.displayMode.type();
    },
    loadTracks: function(callback) {
      var $this = this;
      if (this.album.tracks && this.album.tracks.length > 0) {
        if (typeof callback === "function") {
          setTimeout(function() {
            callback($this.artist, $this.album);
          }, 0);
        }
      } else {
        var filter = {artist: this.artist.id, album: this.album.id};
        var params = {
          flat: true,
          type: Services.displayMode.type()
        };
        this.$emit('loading', true);
        this.loading.albums = true;
        Services.ajax.tracks(filter, params).done(function(data, status) {
          $this.album.tracks = data.data;
          $this.$emit('loading', false);
          if (typeof callback === "function") callback($this.artist, $this.album);
        }).fail(function(){
          $this.$emit('loading', false);
        });
      }
    },
    loadTracksAndAdd: function(autoplay) {
      this.loadTracks(function(artist1, album1) {
        Views.player.$emit('add', album1.tracks, autoplay);
      });
    }
  }
});

var TrackBase = {
  data: function() {
    return {
      shared: festival.state,
      config: festival.config,
      internalAlbum: {}
    };
  },
  props: ['track', 'album'],
  beforeMount: function () {
    this.internalAlbum = this.album || {};
  },
  filters: Filters,
  methods: {
    playOrPause: function(track, tracks) {
      Views.player.$emit('playOrPause', track, tracks);
    },
    add: function(tracks, autoplay, idToPlay) {
      Views.player.$emit('add', tracks, autoplay, idToPlay);
    },
    empty: function() {
      Views.player.$emit('empty');
    },
    download: function() {
      return 'music/' + this.track.id + '?type=' + Services.displayMode.type();
    }
  }
};

FestivalComponents.Track = Vue.component('f-track', {
  mixins: [TrackBase],
  template: '<div class="track" :class="{active: shared.currentTrack && shared.currentTrack == track, failed: track.failed, playing: shared.currentTrack && shared.currentTrack.id == track.id && shared.playing}">' +
    '<span v-if="track.trackno" class="trackno">' +
      '<f-audio-effect></f-audio-effect>' +
      '<span>{{track.trackno}}</span>' +
    '</span>' +
    '<span :title="track.name" class="name">{{track.name}}</span>' +
    '<span class="controls inline-controls">' +
      '<span title="Play" @click="playOrPause(track, internalAlbum.tracks)" class="control">' +
        '<i class="material-icons">{{shared.currentTrack && shared.currentTrack.id == track.id && shared.playing ? "pause" : "play_arrow"}}</i>' +
      '</span>' +
      '<span title="Add to queue" @click="add(track)" class="control">' +
        '<i class="material-icons">add</i>' +
      '</span>' +
      '<a v-if="config.showdlbtn" title="Download album" :href="download()" class="control" download>' +
        '<i class="material-icons">file_download</i>' +
      '</a>' +
    '</span>' +
    '<span class="duration">{{track.duration | duration}}</span>' +
  '</div>'
});

FestivalComponents.TrackSearch = Vue.component('f-track-search', {
  mixins: [TrackBase],
  template: '<div class="track" :class="{active: shared.currentTrack && shared.currentTrack == track, failed: track.failed, playing: shared.currentTrack && shared.currentTrack.id == track.id && shared.playing}">' +
    '<span :title="track.name" class="name">{{track.name}}</span>' +
    '<span :title="track.artist_name" class="name">{{track.artist_name}}</span>' +
    '<span :title="track.album_name" class="name">{{track.album_name}}</span>' +
    '<span class="controls inline-controls">' +
      '<span title="Play" @click="playOrPause(track, album.tracks)" class="control animate">' +
        '<i class="material-icons">{{shared.currentTrack && shared.currentTrack.id == track.id && shared.playing ? \'pause\' : \'play_arrow\'}}</i>' +
      '</span>' +
      '<span title="Add to queue" @click="add(track)" class="control animate">' +
        '<i class="material-icons">add</i>' +
      '</span>' +
      '<a title="Download album" :href="download()" class="control" download>' +
        '<i class="material-icons">file_download</i>' +
      '</a>' +
    '</span>' +
    '<span class="duration">{{track.duration | duration}}</span>' +
  '</div>'
});

FestivalComponents.Playlist = Vue.component('f-playlist', {
  data: function() {
    return {
      tracks: [],
      show: false
    };
  },
  template: '<div :class="{show: show}" class="queue" id="queue">' +
    '<div @click="show = !show" class="handle" :title="show ? \'Hide playlist\' : \'Show playlist\'">' +
      '<span class="vertical-playlist-text"> PLAYLIST </span>' +
      '<i class="material-icons">chevron_left</i>' +
    '</div>' +
    '<div class="queue-content">' +
      '<div class="tracks">' +
        '<f-track v-for="track in tracks" :track="track" :key="track.id"></f-track>' +
      '</div>' +
      '<div class="queue-actions" v-show="tracks.length">' +
        '<button type="button" @click="empty()">Clear playlist</button>' +
      '</div>' +
    '</div>' +
  '</div>',
  methods: {
    updateTracksOnNextTick: function() {
      Vue.nextTick(this.updateTracks.bind(this));
    },
    updateTracks: function() {
      var head = Services.playlist.getHead(), tracks = [];
      if (head) {
        var track = head;
        tracks.push(track);
        while (track.next && track.next !== head) {
          tracks.push(track.next);
          track = track.next;
        }
      }
      this.tracks = tracks;
    },
    tracktitle: function(track) {
      return 'Track: ' + track.name + '\nAlbum: ' + track.album_name + '\nArtist: ' + track.artist_name;
    },
    empty: Services.playlist.empty.bind(Services.playlist),
    playOrPause: function(track, tracks) {
      Views.player.$emit('playOrPause', track, tracks);
    },
    remove: Services.playlist.remove.bind(Services.playlist),
  },
  created: function() {
    Services.playlist.addEventListener('update', this.updateTracksOnNextTick.bind(this));
  }
});

Vue.directive('config', function (el, binding) {
  festival.config = binding.value;
});

Views.init();
