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
    'progressValue': {
      handler: function (val, oldVal) {
        this._progress = val;
        if (val !== oldVal) {
          this.width(this._progress, this._duration);
        }
      },
      immediate: true
    },
    'durationValue': {
      handler: function (val, oldVal) {
        this._duration = val;
        if (val !== oldVal) {
          this.width(this._progress, this._duration);
        }
      },
      immediate: true
    }
  },
  methods: {
    width: function(progress, duration) {
      if (this.$el) {
        if (progress && duration > 0) {
          var newWidth = (progress / duration) * 100;
          if (newWidth > 100) newWidth = 100;
          this.$el.style.width = newWidth + '%';
        } else {
            this.$el.style.width = 0;
        }
      } else {
        var $this = this;
        Vue.nextTick(function() {
          $this.width(progress, duration);
        });
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

Vue.component('infinite-scroll', {
  data: function () {
    return {};
  },
  template: '<div class="artists"><slot></slot></div>',
  props: ['infiniteScrollDisabled', 'infiniteScrollDistance', 'infiniteScrollImmediateCheck', 'infiniteScrollCallback'],
  watch: {
    'infiniteScrollDisabled': function (val, oldVal) {
      if (!val && this.infiniteScrollImmediateCheck) {
        this.doCheck();
      }
    }
  },
  methods: {
    throttle: function throttle(fn, delay) {
      var now, lastExec, timer, context, args;
  
      var execute = function execute() {
        fn.apply(context, args);
        lastExec = now;
      };
  
      return function () {
        context = this;
        args = arguments;
  
        now = Date.now();
  
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
  
        if (lastExec) {
          var diff = delay - (now - lastExec);
          if (diff < 0) {
            execute();
          } else {
            timer = setTimeout(function () {
              execute();
            }, diff);
          }
        } else {
          execute();
        }
      };
    },
    getScrollTop: function getScrollTop(element) {
      if (element === window) {
        return Math.max(window.pageYOffset || 0, document.documentElement.scrollTop);
      }
  
      return element.scrollTop;
    },
    getComputedStyle: document.defaultView.getComputedStyle,
    getScrollEventTarget: function getScrollEventTarget(element) {
      var currentNode = element;
      // bugfix, see http://w3help.org/zh-cn/causes/SD9013 and http://stackoverflow.com/questions/17016740/onscroll-function-is-not-working-for-chrome
      while (currentNode && currentNode.tagName !== 'HTML' && currentNode.tagName !== 'BODY' && currentNode.nodeType === 1) {
        var overflowY = getComputedStyle(currentNode).overflowY;
        if (overflowY === 'scroll' || overflowY === 'auto') {
          return currentNode;
        }
        currentNode = currentNode.parentNode;
      }
      return window;
    },
    getVisibleHeight: function getVisibleHeight(element) {
      if (element === window) {
        return document.documentElement.clientHeight;
      }
  
      return element.clientHeight;
    },
    getElementTop: function getElementTop(element) {
      if (element === window) {
        return this.getScrollTop(window);
      }
      return element.getBoundingClientRect().top + this.getScrollTop(window);
    },
    doBind: function doBind() {
      this.scrollEventTarget = this.getScrollEventTarget(this.$el);
      this.scrollListener = this.throttle(this.doCheck.bind(this), 200);
      this.scrollEventTarget.addEventListener('scroll', this.scrollListener);

      if (this.infiniteScrollImmediateCheck) {
        this.doCheck();
      }
    },
    doCheck: function doCheck(force) {
      var scrollEventTarget = this.scrollEventTarget;
      var element = this.$el;
      var distance = this.infiniteScrollDistance;

      if (force !== true && this.infiniteScrollDisabled) return;
      var viewportScrollTop = this.getScrollTop(scrollEventTarget);
      var viewportBottom = viewportScrollTop + this.getVisibleHeight(scrollEventTarget);

      var shouldTrigger = false;

      if (scrollEventTarget === element) {
        shouldTrigger = scrollEventTarget.scrollHeight - viewportBottom <= distance;
      } else {
        var elementBottom = this.getElementTop(element) - this.getElementTop(scrollEventTarget) + element.offsetHeight + viewportScrollTop;
        shouldTrigger = viewportBottom + distance >= elementBottom;
      }

      if (shouldTrigger && this.infiniteScrollCallback) {
        this.infiniteScrollCallback();
      }
    },
  },
  mounted: function bind() {
    this.doBind();
  },

  destroyed: function unbind() {
    this.scrollEventTarget.removeEventListener('scroll', this.scrollListener);
  }
});