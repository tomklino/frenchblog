var aFrenchExperience = angular.module('aFrenchExperience', []);

aFrenchExperience.controller('networkData', ['$scope', '$rootScope', function ($scope, $rootScope) {
    $rootScope.data = "";
}])
//TODO: seperate this directive to a module and put it in another file
    .directive('afeContentBox', ['$http', '$timeout', '$rootScope', function ($http, $timeout, $rootScope) {
        
        function link(scope, elem, attr, ctrl) {
            
            //TODO: add a condition that will allow editing only if the logged in user is admin
            
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
                        //TODO: create a module for the function within the timeout
                        console.log("Sending a save. Time: " + Date.now());
                        $http({
                            url: "/",
                            method: "POST",
                            data: {
                                action: "edit_content",
                                section: attr.afeContentBox,
                                content: elem.html()
                            }
                        }).then(function (res) {
                            $rootScope.data = "Saved";
                        }, function (res) {
                            $rootScope.data = "Error while saving";
                        });
                        //TODO: the 2000 should be replaced by a global that can be pulled from a seperate file or queried from the server
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