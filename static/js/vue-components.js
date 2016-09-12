/* global Vue */

Vue.component('player-progress', {
  props: ['progressValue', 'durationValue'],
  template: '<div class="progress"></div>',
  watch: {
    'progressValue': {
      handler: function (val, oldVal) {
        if (val !== oldVal) {
          this.width(val, this.durationValue);
        }
      },
      immediate: true
    },
    'durationValue': {
      handler: function (val, oldVal) {
        if (val !== oldVal) {
          this.width(this.progressValue, val);
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
  props: ['loadingValue', 'durationValue'],
  template: '<div class="loading"></div>',
  watch: {
    'loadingValue': function (val, oldVal) {
      if (val && this.durationValue) {
        this.width(val, this.durationValue);
        this.left(val, this.durationValue);
      } else {
        this.$el.style.width = 0;
        this.$el.style.left = 0;
      }
    },
    'durationValue': function (val, oldVal) {
      if (val && this.loadingValue) {
        this.width(this.loadingValue, val);
        this.left(this.loadingValue, val);
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
  template: '<div class="artists"><slot></slot></div>',
  props: {
    infiniteScrollDisabled: {
      type: Boolean,
      default: false
    },
    infiniteScrollDistance: {
      type: Number,
      default: 0
    },
    infiniteScrollImmediateCheck: {
      type: Boolean,
      default: false
    },
    infiniteScrollCallback: {
      type: Function
    }
  },
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

if (!Array.prototype.find) {
  Array.prototype.find = function (predicate) {
    'use strict';

    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

(function() {
  var DEFAULT_PRE = 1.3;
  var Init = {
    preLoad: DEFAULT_PRE,
    hasbind: false,
    try: 1
  };

  var Listeners = [];
  var Loaded = [];
  var throttle = function throttle(action, delay) {
    var timeout = null;
    var lastRun = 0;
    return function() {
      if(timeout) {
        return;
      }
      var elapsed = +new Date() - lastRun;
      var context = this;
      var args = arguments;
      var runCallback = function runCallback() {
        lastRun = +new Date();
        timeout = false;
        action.apply(context, args);
      };
      if(elapsed >= delay) {
        runCallback();
      }
      else {
        timeout = setTimeout(runCallback, delay);
      }
    };
  };
  
  var _ = {
    on: function on(type, func) {
      window.addEventListener(type, func);
    },
    off: function off(type, func) {
      window.removeEventListener(type, func);
    }
  };
  
  var lazyLoadHandler = throttle(function() {
    for(var i = 0, len = Listeners.length; i < len; ++i) {
      checkCanShow(Listeners[i]);
    }
  }, 300);
  
  var onListen = function onListen(start) {
    if(start) {
      _.on('scroll', lazyLoadHandler);
      _.on('wheel', lazyLoadHandler);
      _.on('mousewheel', lazyLoadHandler);
      _.on('resize', lazyLoadHandler);
      _.on('animationend', lazyLoadHandler);
      _.on('transitionend', lazyLoadHandler);
    }
    else {
      Init.hasbind = false;
      _.off('scroll', lazyLoadHandler);
      _.off('wheel', lazyLoadHandler);
      _.off('mousewheel', lazyLoadHandler);
      _.off('resize', lazyLoadHandler);
      _.off('animationend', lazyLoadHandler);
      _.off('transitionend', lazyLoadHandler);
    }
  };
  
  var checkCanShow = function checkCanShow(listener) {
    if(Loaded.indexOf(listener.src) > -1) return setElRender(listener.el, listener.bindType, listener.src, 'loaded');
    var rect = listener.el.getBoundingClientRect();
    if(rect.top < window.innerHeight * Init.preLoad && rect.bottom > 0) {
      render(listener);
    }
  };
  
  var setElRender = function setElRender(el, bindType, src, state) {
    if(!bindType) {
      el.setAttribute('src', src);
    }
    else {
      el.setAttribute('style', bindType + ': url(' + src + ')');
    }
    el.setAttribute('lazy', state);
  };
  
  var render = function render(item) {
    if(item.try >= Init.try) {
      return false;
    }
    item.try++;
    loadImageAsync(item, function(url) {
      var index = Listeners.indexOf(item);
      if(index !== -1) {
        Listeners.splice(index, 1);
      }
      setElRender(item.el, item.bindType, item.src, 'loaded');
      Loaded.push(item.src);
    });
  };
  
  var loadImageAsync = function loadImageAsync(item, resolve) {
    var image = new Image();
    image.src = item.src;
    image.onload = function() {
      resolve(item.src);
    };
  };
  
  var componentWillUnmount = function componentWillUnmount(el, binding, vnode, OldVnode) {
    if(!el) return;
    for(var i = 0, len = Listeners.length; i < len; i++) {
      if(Listeners[i] && Listeners[i].el === el) {
        Listeners.splice(i, 1);
      }
    }
    if(Init.hasbind && Listeners.length == 0) {
      onListen(false);
    }
  };
  
  var addListener = function addListener(el, binding, vnode) {
    if(el.getAttribute('lazy') === 'loaded') return;
    
    var hasIt = Listeners.find(function(item) {
      return item.el === el;
    });
    
    if(hasIt) {
      return Vue.nextTick(function() {
        setTimeout(function() {
          lazyLoadHandler();
        }, 0);
      }
      );
    }
    
    var parentEl = null;
    
    if(binding.modifiers) {
      parentEl = window.document.getElementById(Object.keys(binding.modifiers)[0]);
    }
    
    Vue.nextTick(function() {
      Listeners.push({
        bindType: binding.arg,
        try: 0,
        parentEl: parentEl,
        el: el,
        src: binding.value
      });
      lazyLoadHandler();
      if(Listeners.length > 0 && !Init.hasbind) {
        Init.hasbind = true;
        onListen(true);
      }
    });
  };
  
  Vue.directive('lazy', {
    mount: addListener,
    update: addListener,
    componentUpdated: lazyLoadHandler,
    destroy: componentWillUnmount
  });
})();
