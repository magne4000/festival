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
                        minLength: options.minLength || 1,
                        term: "",
                        ulcache: null,
                        spancache: null
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
                    var keyCode = $.ui.keyCode;
                    switch( event.which ) {
                        case keyCode.TAB:
                            break;
                        case keyCode.ENTER:
                        case keyCode.NUMPAD_ENTER:
                            event.preventDefault();
                        case keyCode.ESCAPE:
                            $this.val( data.term );
                            break;
                        default:
                            clearTimeout( data.searching );
                            data.searching = setTimeout(function() {
                                if ( data.term !== $this.val() && $this.val().length >= data.minLength) {
                                    $this.fastsearch('search', null);
                                }else if ($this.val().length === 0 && data.term.length !== 0){
                                    $this.fastsearch('restore');
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
        restore: function(){
            return this.each(function() {
                var $this = $(this), data = $this.data('fastsearch');
                data.$recipient.find('ul').html(data.ulcache);
                data.$recipient.find('span').remove();
                if (!!data.spancache){
                    data.$recipient.prepend(data.spancache);
                }
                $this.trigger('fastsearchchanged', null);
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
                },
                "json"
            );
        },
        _render: function( items ) {
            var $this = this, data = $this.data('fastsearch'), ul, span;
            ul = data.$recipient.find('ul');
            span = data.$recipient.find('span');
            if (data.ulcache === null){
                data.ulcache = ul.html();
                if (span.length > 0){
                    data.spancache = span;
                }
            }
            ul.empty();
            span.remove();
            if (items.length === 0){
                data.$recipient.prepend('<span>No results match your search.</span>');
            }else{
                $.each( items, function( index, item ) {
                    $( "<li></li>" )
                    .data( "artist", {id: item.id} )
                    .html( item.name + "<div class=\"actionhandler\"></div>" )
                    .appendTo( ul );
                });
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