(function($) {
    var cpt = 0, methods = {
        init : function(options) {
            return this.each(function() {
                var $this = $(this), data = $this.data('recipient');
                // If the plugin hasn't been initialized yet
                if (!data) {
                    $this.data('recipient', {
                        target : $this
                    });
                }
            });
        },
        destroy : function() {
            return this.each(function() {
                var $this = $(this), data = $this.data('recipient');
                $(window).off('.recipient.' + data.cpt);
                $this.removeData('recipient');
            });
        },
        receive : function(event, clicked_objects) {
            var target = event.target; // thrower
            if (clicked_objects){
                // If selectable sent event, several objects can have been selected
                target = clicked_objects;
            }
            // event.data.target is the recipient
            event.data.callback.call(event.data.target, target);
        },
        addListener : function(type, callback) {
            return this.each(function() {
                var $this = $(this), data = $this.data('recipient');
                $(window).on(type + '.recipient.' + cpt, {target : this, callback : callback}, methods.receive);
                data.cpt = cpt;
                cpt = cpt+1;
            });
        }
    };

    $.fn.recipient = function(method) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('jQuery.recipient: Method ' + method + ' does not exist');
        }
    };
})(jQuery);