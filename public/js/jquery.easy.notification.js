/*
 *    Easy Notification - jQuery plugin
 *    written by Alen Grakalic
 *    modified by Joël Charles
 *    http://cssglobe.com
 *
 *    Copyright (c) 2011 Alen Grakalic (http://cssglobe.com)
 *    Dual licensed under the MIT (MIT-LICENSE.txt)
 *    and GPL (GPL-LICENSE.txt) licenses.
 *
 *    Built for jQuery library
 *    http://jquery.com
 */

jQuery.easyNotification = function(options) {

    var defaults = {
        classname : 'notification ui-widget-content ui-corner-all',
        text : 'Notification!',
        parent : 'body',
        prepend : true,
        sibling : '',
        before : true,
        closeClassName : 'close',
        closeText : 'Close',
        cookieEnable : false,
        cookieName : 'notification',
        cookieValue : '123425',
        cookieDays : 30,
        delay : 0,
        autoClose : true,
        duration : 5000,
        callback : function() {}
    }, obj = null, timeout = null;
    if (typeof options == 'string')
        defaults.text = options;
    options = jQuery.extend(defaults, options);

    function setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toGMTString();
        }
        document.cookie = name + "=" + value + expires + "; path=/";
    }

    function getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for ( var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ')
                c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0)
                return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    function deleteCookie(name) {
        setCookie(name, "", -1);
    }

    function checkCookie() {
        var cookieExist = false;
        if (options.cookieEnable) {
            var cookie = getCookie(options.cookieName);
            if (cookie == options.cookieValue)
                cookieExist = true;
        }
        return cookieExist;
    }

    function destroy() {
        if (obj !== null) {
            $(obj).slideUp('fast', function() {
                $(obj).remove();
            });
            if (options.cookieEnable)
                setCookie(options.cookieName, options.cookieValue, options.cookieDays);
            options.callback();
            clearTimeout(timeout);
        }
    }

    function show() {
        clearTimeout(timeout);
        obj = $('<div class="' + options.classname + '">' + options.text + '</div>');
        if (options.closeText){
            $('<span class="' + options.closeClassName + '">' + options.closeText + '</span>').click(function() {
                destroy();
            }).appendTo(obj);
        }
        if (options.sibling !== '') {
            if (options.before) {
                $(obj).hide().insertBefore(options.sibling).fadeIn('fast');
            } else {
                $(obj).hide().insertAfter(options.sibling).fadeIn('fast');
            }
        } else {
            if (options.prepend) {
                $(obj).hide().prependTo(options.parent).fadeIn('fast');
            } else {
                $(obj).hide().appendTo(options.parent).fadeIn('fast');
            }
        }
        if (options.autoClose) {
            timeout = setTimeout(function() {
                destroy();
            }, options.duration);
        }
    }

    if (!checkCookie()) {
        timeout = setTimeout(show, options.delay);
    }

};