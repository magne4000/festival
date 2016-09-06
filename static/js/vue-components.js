/* global Vue */

Vue.component('player-progress', {
  data: function () {
    return {
      _progress: 0,
      _duration: 0
    };
  },
  props: ['progressValue', 'durationValue'],
  template: '<div class="progress"></div>',
  watch: {
    'progressValue': function (val, oldVal) {
      if (val !== oldVal) {
        this._progress = val;
        this.width(this._progress, this._duration);
      }
    },
    'durationValue': function (val, oldVal) {
      if (val !== oldVal) {
        this._duration = val;
        this.width(this._progress, this._duration);
      }
    }
  },
  methods: {
    width: function(progress, duration) {
      if (progress && duration > 0) {
        var newWidth = (progress / duration) * 100;
        if (newWidth > 100) newWidth = 100;
        this.$el.style.width = newWidth + '%';
      } else {
        this.$el.style.width = 0;
      }
    }
  }
});

Vue.component('player-loading', {
  data: function () {
    return {
      _loading: 0,
      _duration: 0
    };
  },
  props: ['loadingValue', 'durationValue'],
  template: '<div class="loading"></div>',
  watch: {
    'loadingValue': function (val, oldVal) {
      this._loading = val;
      if (val && this._duration) {
        this.width(this._loading, this._duration);
        this.left(this._loading, this._duration);
      } else {
        this.$el.style.width = 0;
        this.$el.style.left = 0;
      }
    },
    'durationValue': function (val, oldVal) {
      this._duration = val;
      if (val && this._loading) {
        this.width(this._loading, this._duration);
        this.left(this._loading, this._duration);
      } else {
        this.$el.style.width = 0;
        this.$el.style.left = 0;
      }
    }
  },
  methods: {
    width: function(buffer, duration) {
      var newWidth = ((buffer.end - buffer.start) / duration) * 100;
      if (newWidth > 100) newWidth = 100;
      this.$el.style.width = newWidth + '%';
    },
    left: function(buffer, duration) {
      var newLeft = (buffer.start / duration) * 100;
      this.$el.style.left = newLeft + '%';
    }
  }
});
