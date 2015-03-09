angular.module('festival')
.directive('ngProgress', [function(){
    return {
        scope: {
            ngProgress: "=",
            ngProgressDuration: "="
        },
        require: '?ngProgressDuration',
        link: function(scope, element, attrs) {
            function setWidth(progress, duration) {
                var newWidth = (progress / duration) * 100;
                if (newWidth > 100) newWidth = 100;
                element.width(newWidth + '%');
            }
            
            scope.$watch('ngProgress', function(newValue, oldValue){
                if (newValue && scope.ngProgressDuration) {
                    setWidth(newValue, scope.ngProgressDuration);
                } else {
                    element.width(0);
                }
            });
            
            scope.$watch('ngProgressDuration', function(newValue, oldValue){
                if (newValue && scope.ngProgress) {
                    setWidth(scope.ngProgress, newValue);
                } else {
                    element.width(0);
                }
            });
        }
    };
}])
.directive('ngLoading', [function(){
    return {
        scope: {
            ngLoading: "=",
            ngLoadingDuration: "="
        },
        require: '?ngLoadingDuration',
        link: function(scope, element, attrs) {
            function setWidth(buffer, duration) {
                var newWidth = ((buffer.end - buffer.start) / (duration * 10));
                if (newWidth > 100) newWidth = 100;
                element.width(newWidth + '%');
            }
            
            function setLeft(buffer, duration) {
                var newLeft = (buffer.start / duration) * 100;
                element.css("left", newLeft + '%');
            }
            
            scope.$watch('ngLoading', function(newValue, oldValue){
                if (newValue && scope.ngLoadingDuration) {
                    setWidth(newValue, scope.ngLoadingDuration);
                    setLeft(newValue, scope.ngLoadingDuration);
                } else {
                    element.width(0);
                    element.css("left", 0);
                }
            });
            
            scope.$watch('ngLoadingDuration', function(newValue, oldValue){
                if (newValue && scope.ngLoading) {
                    setWidth(scope.ngLoading, newValue);
                    setLeft(scope.ngLoading, newValue);
                } else {
                    element.width(0);
                    element.css("left", 0);
                }
            });
        }
    };
}])
.directive('suspendable', ['$rootScope', function($rootScope) {
    return {
        link: function(scope) {
            // Heads up: this might break is suspend/resume called out of order
            // or if watchers are added while suspended
            var watchers;

            $rootScope.$on('suspend', function() {
                watchers = scope.$$watchers;
                scope.$$watchers = [];
            });

            $rootScope.$on('resume', function() {
                if (watchers) scope.$$watchers = watchers;

                // discard our copy of the watchers
                watchers = void 0;
            });
        }
    };
}]);