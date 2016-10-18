/* global $ */
/* global Vue */
/* global festival */
/* global Services */
/* global Views */
/* global Filters */

Vue.component('f-audio-effect', {
  template: '<ul class="audioeffect"><li></li><li></li><li></li><li></li><li></li></ul>'
});

var mixinContainer = {
  data: function() {
    return {
      shared: festival.state,
      displayMode: 'artists'
    };
  },
  methods: {
    onArtistSelected: function(artist) {
      Services.Router.selectArtist(artist.id);
    },
    loadX: function(fct, clean, filter, params, loadingkey, next) {
      var $this = this;
      // TODO loading with events
      // this.loading[loadingkey] = true;
      fct(filter, params).done(function(data, status) {
        // $this.loading[loadingkey] = false;
        if (clean) {
          $this.shared.albums = [];
          $this.shared.tracks = [];
          $this.shared.artists = data.data;
        } else {
          Services.utils.extend($this.shared.artists, data.data);
        }
        next((data.data.length > 0));
      }).fail(function(){
        // $this.loading[loadingkey] = false;
        next(false);
      });
    },
    loadArtists: function loadArtists(clean, filter, params, next) {
      this.loadX(Services.ajax.artists, clean, filter, params, 'artists', next);
    },
    loadAlbumsByArtists: function loadAlbumsByArtists(clean, filter, params, next) {
      this.loadX(Services.ajax.albumsbyartists, clean, filter, params, 'albums', next);
    },
    loadLastAlbums: function loadLastAlbums(clean, filter, params, next) {
      this.loadX(Services.ajax.lastalbums, clean, filter, params, 'artists', next);
    },
    loadAlbums: function(artist, params) {
      Services.Router.selectArtist(artist.id);
      if (artist.albums && artist.albums.length > 0) {
        return;
      }
      params = params || {};
      params.type = Services.displayMode.type();
      var filter = {
        artist: artist.id
      };
      Services.ajax.albumsbyartists(filter, params).done(function(data, status) {
        if (data.data.length > 0) {
          artist.albums = data.data[0].albums;
        }
      });
    },
    search: function(clean, term, params, next) {
      var $this = this;
      //TODO v_container.loading.artists = true;
      Services.ajax.search(term, this.checkboxFilter, params).done(function(data, status) {
        //TODO v_container.loading.artists = false;
        if (clean) {
          $this.shared.artists = data.artists;
          $this.shared.albums = data.albums;
          $this.shared.tracks = data.tracks;
        } else {
          $this.shared.artists.push.apply($this.shared.artists, data.artists);
          $this.shared.albums.push.apply($this.shared.albums, data.albums);
          $this.shared.tracks.push.apply($this.shared.tracks, data.tracks);
        }
        next(false);
      }).fail(function(){
        //TODO v_container.loading.artists = false;
        next(false);
      });
    }
  },
  created: function created() {
    var $this = this;
    Services.displayMode.current('artists', {});
    Services.displayMode.on('artists', this.loadArtists.bind(this));
    Services.displayMode.on('albumsbyartists', this.loadAlbumsByArtists.bind(this));
    Services.displayMode.on('lastalbums', this.loadLastAlbums.bind(this));
    Services.displayMode.on('search', this.search.bind(this));
    Services.displayMode.on('modechanged', function(val) {
      $this.displayMode = val;
    });
    
    $(document).on('keydown', null, 'esc', function(e) {
      e.preventDefault();
      Services.Router.selectArtist(null);
    });
  }
};

var ContainerComponent = Vue.component('f-container', {
  mixins: [mixinContainer],
  template: '<div id="container" class="container">' +
    '<f-artists :artists="shared.artists" :selected-artist="shared.selectedArtist" @artist-selected="onArtistSelected"></f-artists>' +
    '<f-albums :albums="shared.selectedArtist.albums" :artist="shared.selectedArtist"></f-albums>' +
  '<div>'
});

var ContainerSearchComponent = Vue.component('f-container', {
  mixins: [mixinContainer],
  template: '<div id="container" class="container search-container">' +
    '<f-artists :artists="shared.artists" :selected-artist="shared.selectedArtist" @artist-selected="onArtistSelected"></f-artists>' +
    '<f-albums :albums="shared.albums"></f-albums>' +
    '<div class="tracks">' +
      '<f-track v-for="track in shared.tracks" :track="track" :key="track.id"></f-track>' +
    '</div>' +
  '<div>'
});

var ArtistsComponent = Vue.component('f-artists', {
  data: function() {
    return {
      loading: false
    };
  },
  props: ['artists', 'selectedArtist'],
  template: '<infinite-scroll :infinite-scroll-callback="pageArtists" :infinite-scroll-immediate-check="true" :infinite-scroll-distance="600">' +
    '<div v-show="loading" class="signal"></div>' +
    '<div v-show="!loading && artists.length == 0" class="noresult">No result matching the search criteria.</div>' +
    '<f-artist :artist="artist" :selected-artist="selectedArtist" v-for="artist in artists" :key="artist.id" @loading="onLoading" @artist-selected="onArtistSelected"></f-artist>' +
  '</infinite-scroll>',
  methods: {
    pageArtists: function() {
      // Here nextTick allow all other events like 'create' on components
      // to be fired before
      Vue.nextTick(Services.displayMode.call.bind(Services.displayMode));
    },
    onLoading: function(bool) {
      this.loading = bool;
    },
    onArtistSelected: function(artist) {
      this.$emit('artist-selected', artist);
    }
  }
});

var ArtistComponent = Vue.component('f-artist', {
  data: function() {
    return {
      loading: false
    };
  },
  props: ['artist', 'selectedArtist'],
  template: '<div class="artist" :class="{selected: artist.id == selectedArtist.id}" @click="toggleArtistSelection();loadAlbumsAndTracks(false)">' +
    '<a :name="\'ar_\'+artist.id" class="anchor"></a>' +
    '<div class="art-container">' +
      '<img v-lazy="\'artistart/\'+artist.id" :alt="artist.name" src="static/images/nocover.png">' +
      '<div class="art-overlay">' +
        '<div class="controls">' +
          '<div title="Play all albums" @click="empty();loadAlbumsAndTracksAndAdd(true)" class="control animate">' +
            '<i class="material-icons">play_arrow</i>' +
          '</div>' +
          '<div title="Add albums to queue" @click="loadAlbumsAndTracksAndAdd(false)" class="control animate">' +
            '<i class="material-icons">add</i>' +
          '</div>' +
          '<div title="Download all albums" @click="download()" class="control">' +
            '<i class="material-icons">file_download</i>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<span class="heading">' +
      '<h3>{{artist.name ? artist.name : "Unknown"}}</h3>' +
    '</span>' +
  '</div>',
  methods: {
    onLoading: function(bool) {
      this.loading = bool;
    },
    download: function() {
      window.location = 'download/artist/' + this.artist.id + '?type=' + Services.displayMode.type();
    },
    toggleArtistSelection: function() {
      this.$emit('artist-selected', this.selectedArtist === this.artist ? {} : this.artist);
    },
    loadAlbumsAndTracks: function(flat, callback) {
      if (!this.artist.albums) {
        var filter = {artist: this.artist.id};
        var params = {
          flat: !!flat,
          type: Services.displayMode.type()
        };
        var $this = this;
        this.$emit('loading', true);
        Services.ajax.tracks(filter, params).done(function(data, status) {
          $this.$emit('loading', false);
          $this.artist.albums = data.data[0].albums;
          if (typeof callback === "function") callback($this.artist);
        }).fail(function(){
          $this.$emit('loading', false);
        });
      } else if (typeof callback === "function") {
        setTimeout(function() {
          callback($this.artist);
        }, 0);
      }
    },
    loadAlbumsAndTracksAndAdd: function(autoplay) {
      this.loadAlbumsAndTracks(this.artist, false, function(artist1) {
        if (artist1.albums) {
          for (var i=0; i<artist1.albums.length; i++) {
            Views.player.add(artist1.albums[i].tracks, autoplay);
            autoplay = false;
          }
        }
      });
    }
  }
});

var AlbumsComponent = Vue.component('f-albums', {
  data: function() {
    return {
      loading: false
    };
  },
  props: ['artist', 'albums'],
  template: '<div class="albums" is="transition-group">' +
    '<div v-show="loading" key="loading" class="signal"></div>' +
    '<f-album-with-tracks v-for="album in albums" :album="album" :artist="artist" :key="album.id" @loading="onLoading"></f-album-with-tracks>' +
  '</div>',
  methods: {
    onLoading: function(bool) {
      this.loading = bool;
    }
  }
});

var AlbumWithTracksComponent = Vue.component('f-album-with-tracks', {
  props: ['album', 'artist'],
  template: '<div class="album">' +
    '<span class="heading">' +
      '<h4 class="heading-title">' +
        '{{album.name}}<span v-if="album.year" class="year">({{album.year}})</span>' +
      '</h4>' +
      '<span class="controls inline-controls">' +
        '<span title="Play tracks" @click="empty();loadTracksAndAdd(true)" class="control animate">' +
          '<i class="material-icons">play_arrow</i>' +
        '</span>' +
        '<span title="Add tracks to queue" @click="loadTracksAndAdd(false)" class="control animate">' +
          '<i class="material-icons">add</i>' +
        '</span>' +
        '<span title="Download album" @click="download()" class="control">' +
          '<i class="material-icons">file_download</i>' +
        '</span>' +
      '</span>' +
    '</span>' +
    '<div class="album-container">' +
      '<img v-lazy="\'albumart/\'+album.id" :alt="album.name" src="static/images/nocover.png">' +
      '<div class="tracks">' +
        '<f-track v-for="track in album.tracks" :track="track" :album="album" :key="track.id"></f-track>' +
      '</div>' +
    '</div>' +
  '</div>',
  methods: {
    empty: Views.player.empty.bind(Views.player),
    download: function() {
      window.location = 'download/album/' + this.album.id + '?type=' + Services.displayMode.type();
    },
    loadTracks: function(callback) {
      if (this.album.tracks && this.album.tracks.length > 0) {
        if (typeof callback === "function") {
          setTimeout(function() {
            callback(this.artist, this.album);
          }, 0);
        }
      } else {
        var filter = {artist: this.artist.id, album: this.album.id};
        var params = {
          flat: true,
          type: Services.displayMode.type()
        };
        var $this = this;
        this.$emit('loading', true);
        this.loading.albums = true;
        Services.ajax.tracks(filter, params).done(function(data, status) {
          this.album.tracks = data.data;
          $this.$emit('loading', false);
          if (typeof callback === "function") callback(this.artist, this.album);
        }).fail(function(){
          $this.$emit('loading', false);
        });
      }
    },
    loadTracksAndAdd: function(autoplay) {
      this.loadTracks(this.artist, this.album, function(artist1, album1) {
        Views.player.add(album1.tracks, autoplay);
      });
    }
  }
});

var TrackBase = {
  data: function() {
    return {
      shared: festival.state,
      internalAlbum: {}
    };
  },
  props: ['track', 'album'],
  beforeMount: function () {
    if (this.album) this.internalAlbum = this.album;
  },
  filters: Filters,
  methods: {
    playOrPause: Views.player.playOrPause.bind(Views.player),
    add: Views.player.add.bind(Views.player),
    empty: Views.player.empty.bind(Views.player),
    download: function() {
      window.location = 'music/' + this.track.id + '?type=' + Services.displayMode.type();
    }
  }
};

var TrackComponent = Vue.component('f-track', {
  mixins: [TrackBase],
  template: '<div class="track" :class="{active: shared.currentTrack && shared.currentTrack == track, failed: track.failed, playing: shared.currentTrack && shared.currentTrack.id == track.id && shared.playing}">' +
    '<span v-if="track.trackno" class="trackno">' +
      '<f-audio-effect></f-audio-effect>' +
      '<span>{{track.trackno}}</span>' +
    '</span>' +
    '<span :title="track.name" class="name">{{track.name}}</span>' +
    '<span class="controls inline-controls">' +
      '<span title="Play" @click="playOrPause(track, internalAlbum.tracks)" class="control animate">' +
        '<i class="material-icons">{{shared.currentTrack && shared.currentTrack.id == track.id && shared.playing ? "pause" : "play_arrow"}}</i>' +
      '</span>' +
      '<span title="Add to queue" @click="add(track)" class="control animate">' +
        '<i class="material-icons">add</i>' +
      '</span>' +
      '<span title="Download album" @click="download()" class="control">' +
        '<i class="material-icons">file_download</i>' +
      '</span>' +
    '</span>' +
    '<span class="duration">{{track.duration | duration}}</span>' +
  '</div>'
});

Views.init();
