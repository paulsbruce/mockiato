var mockapp = angular.module('mockapp',['mockapp.controllers','mockapp.services','mockapp.factories', 'ngSanitize','ngRoute','ngMessages', 'bootstrap.fileField','ui.bootstrap','ngFileSaver', 'angucomplete-alt'])


    .config(["$routeProvider", "$httpProvider", function($routeProvider, $httpProvider){
        //IE caching issue fix
        //initialize get if not there
        if (!$httpProvider.defaults.headers.get) {
            $httpProvider.defaults.headers.get = {};
        }

        //disable IE ajax request caching
        $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
        // extra
        $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
        $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';

        $routeProvider
            .when("/addservice", {
                templateUrl: "partials/addapiform.html",
                controller: "myMenuAppController",
                resolve: {
                    auth: ['$q', 'authService', function($q, authService) {
                        var userInfo = authService.getUserInfo();

                        if (userInfo) {
                            return $q.when(userInfo);
                        } else {
                            return $q.reject({ authenticated: false });
                        }
                    }]
                }
            })

            .when("/update/:id", {
                templateUrl: "partials/updateForm.html",
                controller: "updateController",
                resolve: {
                    auth: ['$q', 'authService', function($q, authService) {
                        var userInfo = authService.getUserInfo();

                        if (userInfo) {
                            return $q.when(userInfo);
                        } else {
                            return $q.reject({ authenticated: false });
                        }
                    }]
                }
            })

            .when("/addOpenAPI", {
                templateUrl: "partials/openApiForm.html",
                controller: "oasController",
                resolve: {
                    auth: ['$q', 'authService', function($q, authService) {
                        var userInfo = authService.getUserInfo();

                        if (userInfo) {
                            return $q.when(userInfo);
                        } else {
                            return $q.reject({ authenticated: false });
                        }
                    }]
                }
            })

            .when("/addTemplate", {
                templateUrl: "partials/templateForm.html",
                controller: "templateController",
                resolve: {
                    auth: ['$q', 'authService', function($q, authService) {
                        var userInfo = authService.getUserInfo();

                        if (userInfo) {
                            return $q.when(userInfo);
                        } else {
                            return $q.reject({ authenticated: false });
                        }
                    }]
                }
            })

            .when("/fetchservices", {
                templateUrl: "partials/servicehistory.html",
                controller: "serviceHistoryController",
                resolve: {
                    auth: ['$q', 'authService', function($q, authService) {
                        var userInfo = authService.getUserInfo();

                        if (userInfo) {
                            return $q.when(userInfo);
                        } else {
                            return $q.reject({ authenticated: false });
                        }
                    }]
                }
            })

            .when("/helppage", {
                templateUrl: "partials/help.html",
                controller: "ContactFormController"

            })

            .when("/datagen", {
                templateUrl: "partials/datagen.html",
                controller: "dataGenController"

            })

            .when('/login', {
                templateUrl: 'partials/login.html',
                controller: 'authController'
            })

            .otherwise({
                redirectTo: "/addservice"
            });
    }]);

    // Object.entries polyfill for IE
    if (!Object.entries)
        Object.entries = function( obj ){
        var ownProps = Object.keys( obj ),
            i = ownProps.length,
            resArray = new Array(i); // preallocate the Array
        while (i--)
            resArray[i] = [ownProps[i], obj[ownProps[i]]];

        return resArray;
    };
