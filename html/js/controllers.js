var aFrenchExperience = angular.module('aFrenchExperience', []);

aFrenchExperience.controller('networkData', ['$scope', '$rootScope', function ($scope, $rootScope) {
    $rootScope.data = "";
}])
    .directive('afeContentBox', ['$http', '$timeout', '$rootScope', function ($http, $timeout, $rootScope) {
        function link(scope, elem, attr, ctrl) {
            
            function unmakeEditable(elem) {
                elem.attr("contentEditable", "false");
                elem.off("input");
            }

            function makeEditable(elem, attr) {
                
                //holder for the timeout promise
                var toSaveTimeout = undefined;

                elem.attr("contentEditable", "true");
                elem.on("input", function () {

                    if(toSaveTimeout) {
                        $timeout.cancel(toSaveTimeout);
                    }
                    toSaveTimeout = $timeout(function () {
                        $http({
                            url: "/",
                            method: "POST",
                            data: {
                                action: "edit_content",
                                section: attr.afeContentBox,
                                content: elem.html()
                            }
                        }).then(function (res) {
                            console.log(res);
                            $rootScope.data = "Saved";
                        }, function (res) {
                            $rootScope.data = "Error while saving";
                        });
                    }, 2000);
                });

                angular.element(document).on("click", function () {
                    unmakeEditable(elem);
                    angular.element(document).off("click");
                    elem.off("click");
                });

                elem.on("click", function (e) {
                    e.stopPropagation();
                });
            }
            
            elem.on("dblclick", function () {
                makeEditable(elem, attr);
            })

        }

        return {
            restrict: 'A',
            scope: {
                content: '=afeContentBox',
            },
            templateUrl: function (elem, attr) {
              return "contents/" + attr.afeContentBox;  
            },
            link: link
        };
    }]);