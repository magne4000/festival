angular.module('festival')
.filter('duration', function() {
    return function(diffInS) {
        diffInS = Math.floor(diffInS);
        var diffInMinutes = Math.max(0, Math.floor(diffInS / 60));
        diffInS = diffInS % 60;
        return [
            ('0'+diffInMinutes).slice(-2),
            ('0'+diffInS).slice(-2)
        ].join(':');
    };
});