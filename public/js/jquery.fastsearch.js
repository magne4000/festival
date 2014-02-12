(function($) {
    var methods = {
        init : function(options) {
            return this.each(function() {
                var $this = $(this), data = $this.data('fastsearch');
                // If the plugin hasn't been initialized yet
                if (!data) {
                    $this.data('fastsearch', {
                        $recipient: $(options.recipient),
                        source: options.source,
                        target: $this,
                        delay: options.delay || 200,
                        term: ""
                    });
                    data = $this.data('fastsearch');
                }
                $this.on( "keydown", function( event ) {
                    event.stopPropagation();
                });
                $this.on( "search", function( event ) {
                    if (!$this.val()){
                        $this.fastsearch('restore');
                    }
                });
                $this.on( "keyup", function( event ) {
                    var keyCode = utils.keyCode;
                    switch( event.which ) {
                        case keyCode.TAB:
                            break;
                        case keyCode.ENTER:
                        case keyCode.NUMPAD_ENTER:
                            event.preventDefault();
                            //no break;
                        case keyCode.ESCAPE:
                            $this.val( data.term );
                            break;
                        default:
                            clearTimeout( data.searching );
                            data.searching = setTimeout(function() {
                                if ( data.term !== $this.val()) {
                                    $this.fastsearch('search', null);
                                }
                                data.term = $this.val();
                            }, data.delay );
                            break;
                    }
                });
            });
        },
        destroy : function() {
            return this.each(function() {
                var $this = $(this);
                $this.off('.fastsearch');
                $this.removeData('fastsearch');
            });
        },
        search: function(value) {
            var $this = $(this), data = $this.data('fastsearch'), url = data.source;
            value = value !== null ? value : $this.val();
            $this.trigger('fastsearchchange', value);
            $.post(
                url,
                {term: value},
                function( items ) {
                    $this.fastsearch('_render', items);
                    $this.trigger('fastsearchchanged', value);
                }
            );
        },
        _render: function( items ) {
            var $this = this, data = $this.data('fastsearch');
            data.$recipient.empty();
            if (!items){
                data.$recipient.html('<span>No results match your search.</span>');
            }else{
                data.$recipient.html(items);
            }
        }
    };

    $.fn.fastsearch = function(method) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('jQuery.fastsearch: Method ' + method + ' does not exist');
        }
    };
})(jQuery);
