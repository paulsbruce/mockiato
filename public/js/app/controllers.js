var ctrl = angular.module("mockapp.controllers",['mockapp.services','mockapp.factories','ngFileSaver'])

    .controller('authController', ['$scope','authService',
        function($scope,authService) {
            $scope.loginUser = function(credentials) {
                authService.login(credentials.username, credentials.password);
            };
    }])

  .controller("templateController", ['$scope', 'templateService', 'ctrlConstants',
    function ($scope, templateService, ctrlConstants) {
      $scope.uploadSuccessHint = '';
      $scope.uploadErrMessage = '';
      $scope.importDoc = function () {
        $scope.uploadSuccessHint = '';
        $scope.uploadErrMessage = '';
        if ($scope.importTemp.name.endsWith('.json')) {
          $scope.uploadSuccessHint = ctrlConstants.SUCCESS;
          $scope.uploadErrMessage = '';
        } else {
          $scope.uploadErrMessage = ctrlConstants.IMPORT_ERR_MSG;
          $scope.uploadSuccessHint = '';
        }
      };
      $scope.publish = function () {
        templateService.importTemplate($scope.previewTemp);
      };
    }])

    .controller("myMenuAppController", ['$scope', 'apiHistoryService', 'sutService', 'authService', 'suggestionsService', 'helperFactory', 'ctrlConstants', 
      function ($scope, apiHistoryService, sutService,authService,suggestionsService,helperFactory,ctrlConstants){
            $scope.myUser = authService.getUserInfo().username;
            $scope.sutlist = sutService.getGroupsByUser($scope.myUser);
            $scope.servicevo = {};
            $scope.servicevo.matchTemplates = [{ id: 0, val: '' }];
            $scope.servicevo.failStatuses = [{ id: 0, val: '' }];
            $scope.servicevo.failStrings = [{ id: 0, val: '' }];
            $scope.servicevo.rawpairs = [{
                id: 0,
                queriesArr: [{
                  id: 0
                }],
                reqHeadersArr: [{
                  id: 0,
                }],
                resHeadersArr: [{
                  id: 0
                }]
            }];

            $scope.statusCodes = suggestionsService.getStatusCodes();
            $scope.possibleHeaders = suggestionsService.getPossibleHeaders();

            $scope.addFailStatus = function(){
              $scope.servicevo.failStatuses.push({val:''});
            }
            $scope.removeFailStatus= function(index){
              $scope.servicevo.failStatuses.splice(index,1);
            }
            $scope.addFailString = function(){
              $scope.servicevo.failStrings.push({val:''});
            }
            $scope.removeFailString= function(index){
              $scope.servicevo.failStrings.splice(index,1);
            }
            $scope.addTemplate = function() {
              $scope.servicevo.matchTemplates.push({ id: 0, val: '' });
            };

            $scope.removeTemplate = function(index) {
              $scope.servicevo.matchTemplates.splice(index, 1);
            };

            $scope.addNewRRPair = function() {
              var newItemNo = $scope.servicevo.rawpairs.length;
              $scope.servicevo.rawpairs.push({
                  id: newItemNo,
                  queriesArr: [{
                    id: 0
                  }],
                  reqHeadersArr: [{
                    id: 0
                  }],
                  resHeadersArr: [{
                    id: 0
                  }]
              });
            };

            $scope.removeRRPair = function(index) {
              $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.DEL_CONFIRM_TITLE);
              $('#genricMsg-dialog').find('.modal-body').html(ctrlConstants.DEL_CONFIRM_RRPAIR_BODY);
              $('#genricMsg-dialog').find('.modal-footer').html(ctrlConstants.DEL_CONFIRM_FOOTER);
              $('#genricMsg-dialog').modal('toggle');
              $scope.rrPairNo = index;
              $('#modal-btn-yes').on("click", function () {
                  $scope.servicevo.rawpairs.splice($scope.rrPairNo,1);
                  $scope.$apply();
                });
            };

            $scope.addNewReqHeader = function(rr) {
              var newItemNo = rr.reqHeadersArr.length;
              rr.reqHeadersArr.push({'id':newItemNo});
            };

            $scope.removeReqHeader = function(rr) {
              var lastItem = rr.reqHeadersArr.length-1;
              rr.reqHeadersArr.splice(lastItem);
            };

            $scope.addNewResHeader = function(rr) {
              var newItemNo = rr.resHeadersArr.length;
              rr.resHeadersArr.push({'id':newItemNo});
            };

            $scope.removeResHeader = function(rr) {
              var lastItem = rr.resHeadersArr.length-1;
              rr.resHeadersArr.splice(lastItem);
            };

            $scope.addQuery = function(rr) {
              var newItemNo = rr.queriesArr.length;
              rr.queriesArr.push({'id':newItemNo});
            };

            $scope.removeQuery = function(rr) {
              var lastItem = rr.queriesArr.length-1;
              rr.queriesArr.splice(lastItem);
            };

            $scope.setContentType = function(rr, type) {
              if (!rr)
                rr = $scope.servicevo.rawpairs[0];
                
              if (rr.reqHeadersArr.length < 2)
                $scope.addNewReqHeader(rr);

              if (rr.resHeadersArr.length < 2)
                $scope.addNewResHeader(rr);

              // set values
              rr.reqHeadersArr[0].v = type;
              rr.resHeadersArr[0].v = type;
              
              rr.reqHeadersArr[0].k = 'Content-Type';
              rr.resHeadersArr[0].k = 'Content-Type';

              $scope.$broadcast('angucomplete-alt:changeInput', 'req-header-0', rr.reqHeadersArr[0].k);
              $scope.$broadcast('angucomplete-alt:changeInput', 'res-header-0', rr.resHeadersArr[0].k);
            };
            
          $scope.publishservice = function (servicevo) {
            try {
              if (helperFactory.isDuplicateReq(servicevo)) {
                $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.DUP_REQ_ERR_TITLE);
                $('#genricMsg-dialog').find('.modal-body').text(ctrlConstants.DUP_REQ_ERR_BODY);
                $('#genricMsg-dialog').find('.modal-footer').html(ctrlConstants.DUPLICATE_CONFIRM_FOOTER);
                $('#genricMsg-dialog').modal('toggle');
              } else {
                apiHistoryService.publishServiceToAPI(servicevo);
              }
            }
            catch (e) {
              $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.PUB_FAIL_ERR_TITLE);
              $('#genricMsg-dialog').find('.modal-body').text(ctrlConstants.PUB_FAIL_SERV_SAVE_BODY);
              $('#genricMsg-dialog').find('.modal-footer').html(ctrlConstants.PUB_FAIL_SERV_SAVE_FOOTER);              
              $('#genricMsg-dialog').modal('toggle');
              // $('#modal-btn-yes').on("click", function () {
              //   apiHistoryService.saveServiceAsDraft(servicevo, false);
              // });
            }
          };
    }])

    .controller("createRecorderController", ['$scope', 'apiHistoryService', 'sutService', 'authService', 'suggestionsService', 'helperFactory', 'ctrlConstants', 
      function($scope,apiHistoryService,sutService,authService,suggestionsService,helperFactory,ctrlConstants){
        $scope.myUser = authService.getUserInfo().username;
        $scope.sutlist = sutService.getGroupsByUser($scope.myUser);
        $scope.servicevo = {};
        $scope.servicevo.matchTemplates = [{ id: 0, val: '' }];
        $scope.possibleHeaders = suggestionsService.getPossibleHeaders();
        $scope.servicevo.reqHeadersArr = [{id:0}];

        $scope.showRecorderHelp = function(){
          $('#recordingHelp-modal').modal('toggle');
        }
        $scope.addNewReqHeader = function(service) {
          var newItemNo = service.reqHeadersArr.length;
          service.reqHeadersArr.push({'id':newItemNo});
        };

        $scope.removeReqHeader = function(service) {
          var lastItem = service.reqHeadersArr.length-1;
          service.reqHeadersArr.splice(lastItem);
        };

        $scope.createRecorder = function (servicevo) {
          apiHistoryService.publishRecorderToAPI(servicevo);
        };

    }])
    .controller("viewRecorderController", ['$scope', '$http', '$routeParams', 'apiHistoryService', 'feedbackService', 'suggestionsService', 'helperFactory', 'ctrlConstants', '$timeout',
      function($scope, $http, $routeParams, apiHistoryService, feedbackService, suggestionsService, helperFactory, ctrlConstants,$timeout){
        $scope.statusCodes = suggestionsService.getStatusCodes();
        $scope.possibleHeaders = suggestionsService.getPossibleHeaders();
        var totalRRPairs = 0;

        

        function processRRPairs(rrpairs){
          var rrpairsRaw = [];
          var rrid = 0;
          rrpairs.forEach(function(rr){
            rr.id = rrid++;
            console.log(rr);
            rr.queriesArr = [];
            rr.reqHeadersArr = [];
            rr.resHeadersArr = [];
            rr.method = rr.verb;

            if (rr.payloadType === 'JSON') {
              rr.requestpayload = JSON.stringify(rr.reqData);
              rr.responsepayload = JSON.stringify(rr.resData);

              //Handle empty JSON object- stringify surrounds in "" 
              if(rr.responsepayload == "\"[]\"" || rr.responsepayload == "\"{}\""){
                rr.responsepayload = rr.responsepayload.substring(1,3);
              }
            }
            else {
              rr.requestpayload = rr.reqData;
              rr.responsepayload = rr.resData;
            }

            // map object literals to arrays for Angular view
            if (rr.reqHeaders) {
              var reqHeads = Object.entries(rr.reqHeaders);
              var reqHeadId = 0;
              reqHeads.forEach(function(elem){
                var head = {};

                head.id = reqHeadId;
                head.k = elem[0];
                head.v = elem[1];

                rr.reqHeadersArr.push(head);
                reqHeadId++;
              });
            }
            else {
              rr.reqHeadersArr.push({ id: 0 });
            }

            if (rr.resHeaders) {
              var resHeads = Object.entries(rr.resHeaders);
              var resHeadId = 0;
              resHeads.forEach(function(elem){
                var head = {};

                head.id = resHeadId;
                head.k = elem[0];
                head.v = elem[1];

                rr.resHeadersArr.push(head);
                resHeadId++;
              });
            }
            else {
              rr.resHeadersArr.push({ id: 0 });
            }

            if (rr.queries) {
              var qs = Object.entries(rr.queries);
              var qId = 0;
              qs.forEach(function(elem){
                var q = {};

                q.id = qId;
                q.k = elem[0];
                q.v = elem[1];

                rr.queriesArr.push(q);
                qId++;
              });
            }
            else {
              rr.queriesArr.push({ id: 0 });
            }

            rrpairsRaw.push(rr);
          });
          return rrpairsRaw;
        }

        //Polls for new data + applies every X millis
        function pollForNewRRPair(delay){
          $timeout(function(){
              apiHistoryService.getRecordingRRPairsWithIndex($routeParams.id,totalRRPairs).then(function(response){
                if(response.data.length){
                  console.log(response.data);
                  var rrpairs = processRRPairs(response.data);
                  rrpairs.forEach(function(rr){
                    rr.id = totalRRPairs++;
                    
                  });
                  $scope.servicevo.rawpairs = $scope.servicevo.rawpairs.concat(rrpairs);
                  console.log(rrpairs);
                }
                if($routeParams.id)
                  pollForNewRRPair(delay);
            }).catch(function(err){
                if($routeParams.id)
                  pollForNewRRPair(delay);
            });
          }
          
          ,delay);

        }

        $scope.removeRRPair = function(index) {
          $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.DEL_CONFIRM_TITLE);
          $('#genricMsg-dialog').find('.modal-body').html(ctrlConstants.DEL_CONFIRM_RRPAIR_BODY);
          $('#genricMsg-dialog').find('.modal-footer').html(ctrlConstants.DEL_CONFIRM_FOOTER);
          $('#genricMsg-dialog').modal('toggle');
          $scope.rrPairNo = index;
          $('#modal-btn-yes').on("click", function () {
              $scope.servicevo.rawpairs.splice($scope.rrPairNo,1);
              $scope.$apply();
            });
        };
        
        $scope.addTemplate = function() {
          $scope.servicevo.matchTemplates.push({ id: 0, val: '' });
        };

        $scope.removeTemplate = function(index) {
          $scope.servicevo.matchTemplates.splice(index, 1);
        };

        $scope.addNewRRPair = function() {
          var newItemNo = $scope.servicevo.rawpairs.length;
          $scope.servicevo.rawpairs.push({
              id: newItemNo,
              queriesArr: [{
                id: 0
              }],
              reqHeadersArr: [{
                id: 0
              }],
              resHeadersArr: [{
                id: 0
              }]
          });
        };

        $scope.removeReqHeader = function(rr) {
          var lastItem = rr.reqHeadersArr.length-1;
          rr.reqHeadersArr.splice(lastItem);
        };

        $scope.addNewResHeader = function(rr) {
          var newItemNo = rr.resHeadersArr.length;
          rr.resHeadersArr.push({'id':newItemNo});
        };

        $scope.addNewReqHeader = function(rr) {
          var newItemNo = rr.reqHeadersArr.length;
          rr.reqHeadersArr.push({'id':newItemNo});
        }; 
        
        $scope.removeResHeader = function(rr) {
          var lastItem = rr.resHeadersArr.length-1;
          rr.resHeadersArr.splice(lastItem);
        };

        $scope.addQuery = function(rr) {
          var newItemNo = rr.queriesArr.length;
          rr.queriesArr.push({'id':newItemNo});
        };

        $scope.removeQuery = function(rr) {
          var lastItem = rr.queriesArr.length-1;
          rr.queriesArr.splice(lastItem);
        };
        //Get this recorder's data
        apiHistoryService.getRecordingById($routeParams.id)
        .then(function(response) {
          console.log(response);
          var recorder = response.data;
          var service = recorder.service;
          $scope.servicevo = {
            id: service._id,
            sut: service.sut,
            name: service.name,
            type: service.type,
            basePath: service.basePath
          };
          $scope.servicevo.matchTemplates = [{ id: 0, val: '' }];
          $scope.servicevo.rawpairs = processRRPairs(service.rrpairs);
          totalRRPairs = service.rrpairs.length;
          

          pollForNewRRPair(3000);
        });

        $scope.publishService = function(servicevo) {
          try {
            if (helperFactory.isDuplicateReq(servicevo)) {
            $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.DUP_REQ_ERR_TITLE);
            $('#genricMsg-dialog').find('.modal-body').text(ctrlConstants.DUP_REQ_ERR_BODY);
            $('#genricMsg-dialog').find('.modal-footer').html(ctrlConstants.DUPLICATE_CONFIRM_FOOTER);
            $('#genricMsg-dialog').modal('toggle');
            } else {
              apiHistoryService.publishServiceToAPI(servicevo, false,true);

            }
          }
          catch(e) {
            console.log(e);
            $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.PUB_FAIL_ERR_TITLE);
            $('#genricMsg-dialog').find('.modal-body').text(ctrlConstants.PUB_FAIL_ERR_BODY);
            $('#genricMsg-dialog').modal('toggle');
          }
        };


    }])

    
    .controller("showArchiveController", ['$scope', '$q', '$http', '$routeParams', 'apiHistoryService', 'feedbackService', 'suggestionsService', 'helperFactory', 'ctrlConstants', 'sutService', 'authService',
        function ($scope, $q, $http, $routeParams, apiHistoryService, feedbackService, suggestionsService, helperFactory, ctrlConstants, sutService, authService) {    
          
          $scope.statusCodes = suggestionsService.getStatusCodes();
            $scope.possibleHeaders = suggestionsService.getPossibleHeaders();

              this.getService = function() {
                  apiHistoryService.getArchiveServiceById($routeParams.id)
                  .then(function(response) {
                      var service;
                      if(response.data.service) service = response.data.service;
                      if(response.data.mqservice) service = response.data.mqservice;
                      console.log(service);
                      $scope.servicevo = {
                        id: service._id,
                        sut: service.sut,
                        name: service.name,
                        type: service.type,
                        delay: service.delay,
                        delayMax: service.delayMax,
                        txnCount: service.txnCount,
                        basePath: service.basePath,
                        
                      };
                    
                    $scope.myUser = authService.getUserInfo().username;
                  
                   //returning a promise from factory didnt seem to work with .then() function here, alternative solution
                       $http.get('/api/systems')
                         .then(function (response) {
                           var newsutlist = [];
                           response.data.forEach(function (sutData) {
                             var sut = {
                               name: sutData.name,
                               members: sutData.members
                             };
                             sut.members.forEach(function (memberlist) {
                               if (memberlist.includes($scope.myUser)) {
                                newsutlist.push(sut.name);
                               }
                             });
                           });
                           $scope.canEdit = function () {
                               return false;
                           };
                         })
  
                         .catch(function (err) {
                           console.log(err);
                         });
  
                      if(service.lastUpdateUser){
                        $scope.servicevo.lastUpdateUser = service.lastUpdateUser.uid;
                      }
                      if(service.createdAt){
                        $scope.servicevo.createdAt = service.createdAt;
                      }
                      if(service.updatedAt){
                        $scope.servicevo.updatedAt = service.updatedAt;
                      }
  
                      $scope.servicevo.matchTemplates = [];
                      $scope.servicevo.rawpairs = [];
  
                      if (service.matchTemplates && service.matchTemplates.length) {
                        service.matchTemplates.forEach(function(template, index) {
                          $scope.servicevo.matchTemplates.push({ id: index, val: template });
                        });
                      }
                      else {
                        $scope.servicevo.matchTemplates.push({ id: 0, val: '' });
                      }
  
                      var rrid = 0;
                      service.rrpairs.forEach(function(rr){
                        rr.id = rrid;
                        rr.queriesArr = [];
                        rr.reqHeadersArr = [];
                        rr.resHeadersArr = [];
                        rr.method = rr.verb;
  
                        if (rr.payloadType === 'JSON') {
                          rr.requestpayload = JSON.stringify(rr.reqData, null, 4);
                          rr.responsepayload = JSON.stringify(rr.resData, null, 4);
  
                          //Handle empty JSON object- stringify surrounds in "" 
                          if(rr.responsepayload == "\"[]\"" || rr.responsepayload == "\"{}\""){
                            rr.responsepayload = rr.responsepayload.substring(1,3);
                          }
                        }
                        else {
                          rr.requestpayload = rr.reqData;
                          rr.responsepayload = rr.resData;
                        }
  
                        // map object literals to arrays for Angular view
                        if (rr.reqHeaders) {
                          var reqHeads = Object.entries(rr.reqHeaders);
                          var reqHeadId = 0;
                          reqHeads.forEach(function(elem){
                            var head = {};
  
                            head.id = reqHeadId;
                            head.k = elem[0];
                            head.v = elem[1];
  
                            rr.reqHeadersArr.push(head);
                            reqHeadId++;
                          });
                        }
                        else {
                          rr.reqHeadersArr.push({ id: 0 });
                        }
  
                        if (rr.resHeaders) {
                          var resHeads = Object.entries(rr.resHeaders);
                          var resHeadId = 0;
                          resHeads.forEach(function(elem){
                            var head = {};
  
                            head.id = resHeadId;
                            head.k = elem[0];
                            head.v = elem[1];
  
                            rr.resHeadersArr.push(head);
                            resHeadId++;
                          });
                        }
                        else {
                          rr.resHeadersArr.push({ id: 0 });
                        }
  
                        if (rr.queries) {
                          var qs = Object.entries(rr.queries);
                          var qId = 0;
                          qs.forEach(function(elem){
                            var q = {};
  
                            q.id = qId;
                            q.k = elem[0];
                            q.v = elem[1];
  
                            rr.queriesArr.push(q);
                            qId++;
                          });
                        }
                        else {
                          rr.queriesArr.push({ id: 0 });
                        }
  
                        $scope.servicevo.rawpairs.push(rr);
                        rrid++;
                      }); 
                  })
  
                  .catch(function(err) {
                      console.log(err);
                  });
              };
              this.getService();
      }])

        .controller("showDraftController", ['$scope', '$q', '$http', '$routeParams', 'apiHistoryService', 'feedbackService', 'suggestionsService', 'helperFactory', 'ctrlConstants', 'sutService', 'authService',
        function ($scope, $q, $http, $routeParams, apiHistoryService, feedbackService, suggestionsService, helperFactory, ctrlConstants, sutService, authService) {    
          
          $scope.statusCodes = suggestionsService.getStatusCodes();
            $scope.possibleHeaders = suggestionsService.getPossibleHeaders();

            this.getService = function() {
                apiHistoryService.getDraftServiceById($routeParams.id)

                .then(function(response) {
                    var service;
                    if(response.data.service) service = response.data.service;
                    if(response.data.mqservice) service = response.data.mqservice;
                                      
                    console.log(service);
                    $scope.servicevo = {
                      id: service._id,
                      sut: service.sut,
                      name: service.name,
                      type: service.type,
                      delay: service.delay,
                      delayMax: service.delayMax,
                      txnCount: service.txnCount,
                      basePath: service.basePath
                    };
                    
                    if(service.liveInvocation){
                      
                      $scope.servicevo.remoteHost = service.liveInvocation.remoteHost;
                      $scope.servicevo.remotePort = service.liveInvocation.remotePort;
                      $scope.servicevo.remotePath = service.liveInvocation.remoteBasePath;
                      $scope.servicevo.liveInvocationCheck = service.liveInvocation.enabled;
                      $scope.servicevo.invokeSSL = service.liveInvocation.ssl;
                      //Extract and build out codes/strings for failures
                      var failStatusCodes = service.liveInvocation.failStatusCodes;
                      var failStrings = service.liveInvocation.failStrings;
                      $scope.servicevo.failStatuses = [];
                      $scope.servicevo.failStrings = [];
                      for(var i = 0; i < failStatusCodes.length; i++){
                        $scope.servicevo.failStatuses[i] = {'id': i, 'val' : failStatusCodes[i]};

                      }
                      for(var i = 0; i < failStrings.length; i++){
                        $scope.servicevo.failStrings[i] = {'id': i, 'val' : failStrings[i]};
                      }
                      if(!$scope.servicevo.failStatuses.length){
                        $scope.servicevo.failStatuses[0] = {'id': 0,val:''};  
                      }
                      if(!$scope.servicevo.failStrings.length){
                        $scope.servicevo.failStrings[0] = {'id': 0,val:''};
                      }
                      //Select correct radio
                      if(service.liveInvocation.liveFirst)
                        $scope.servicevo.liveInvokePrePost = 'PRE';
                      else  
                        $scope.servicevo.liveInvokePrePost = 'POST';
                      
                    }else{
                      $scope.servicevo.failStatuses = [];
                      $scope.servicevo.failStrings = [];
                      $scope.servicevo.failStatuses[0] = {'id': 0,val:''};      
                      $scope.servicevo.failStrings[0] = {'id': 0,val:''};
                    }
                    console.log($scope.servicevo);
                  
                  $scope.myUser = authService.getUserInfo().username;
                
                //returning a promise from factory didnt seem to work with .then() function here, alternative solution
                    $http.get('/api/systems')
                      .then(function (response) {
                        var newsutlist = [];
                        response.data.forEach(function (sutData) {
                          var sut = {
                            name: sutData.name,
                            members: sutData.members
                          };
                          sut.members.forEach(function (memberlist) {
                            if (memberlist.includes($scope.myUser)) {
                              newsutlist.push(sut.name);
                            }
                          });
                        });

                        $scope.canEdit = function () {
                          if (newsutlist.includes($scope.servicevo.sut.name )) {
                            return true;
                          }
                          else {
                            return false;
                          }
                        };
                      })

                      .catch(function (err) {
                        console.log(err);
                      });

                    if(service.lastUpdateUser){
                      $scope.servicevo.lastUpdateUser = service.lastUpdateUser.uid;
                    }
                    if(service.createdAt){
                      $scope.servicevo.createdAt = service.createdAt;
                    }
                    if(service.updatedAt){
                      $scope.servicevo.updatedAt = service.updatedAt;
                    }

                    $scope.servicevo.matchTemplates = [];
                    $scope.servicevo.rawpairs = [];


                    if (service.matchTemplates && service.matchTemplates.length) {
                      service.matchTemplates.forEach(function(template, index) {
                        $scope.servicevo.matchTemplates.push({ id: index, val: template });
                      });
                    }
                    else {
                      $scope.servicevo.matchTemplates.push({ id: 0, val: '' });
                    }

                    var rrid = 0;
                    service.rrpairs.forEach(function(rr){
                      rr.id = rrid;
                      rr.queriesArr = [];
                      rr.reqHeadersArr = [];
                      rr.resHeadersArr = [];
                      rr.method = rr.verb;

                      if (rr.payloadType === 'JSON') {
                        rr.requestpayload = JSON.stringify(rr.reqData, null, 4);
                        rr.responsepayload = JSON.stringify(rr.resData, null, 4);

                        //Handle empty JSON object- stringify surrounds in "" 
                        if(rr.responsepayload == "\"[]\"" || rr.responsepayload == "\"{}\""){
                          rr.responsepayload = rr.responsepayload.substring(1,3);
                        }
                      }
                      else {
                        rr.requestpayload = rr.reqData;
                        rr.responsepayload = rr.resData;
                      }

                      // map object literals to arrays for Angular view
                      if (rr.reqHeaders) {
                        var reqHeads = Object.entries(rr.reqHeaders);
                        var reqHeadId = 0;
                        reqHeads.forEach(function(elem){
                          var head = {};

                          head.id = reqHeadId;
                          head.k = elem[0];
                          head.v = elem[1];

                          rr.reqHeadersArr.push(head);
                          reqHeadId++;
                        });
                      }
                      else {
                        rr.reqHeadersArr.push({ id: 0 });
                      }

                      if (rr.resHeaders) {
                        var resHeads = Object.entries(rr.resHeaders);
                        var resHeadId = 0;
                        resHeads.forEach(function(elem){
                          var head = {};

                          head.id = resHeadId;
                          head.k = elem[0];
                          head.v = elem[1];

                          rr.resHeadersArr.push(head);
                          resHeadId++;
                        });
                      }
                      else {
                        rr.resHeadersArr.push({ id: 0 });
                      }

                      if (rr.queries) {
                        var qs = Object.entries(rr.queries);
                        var qId = 0;
                        qs.forEach(function(elem){
                          var q = {};

                          q.id = qId;
                          q.k = elem[0];
                          q.v = elem[1];

                          rr.queriesArr.push(q);
                          qId++;
                        });
                      }
                      else {
                        rr.queriesArr.push({ id: 0 });
                      }

                      $scope.servicevo.rawpairs.push(rr);
                      rrid++;
                    });
                })

                .catch(function(err) {
                    console.log(err);
                });
            };
            this.getService();

            $scope.addFailStatus = function(){
              $scope.servicevo.failStatuses.push({val:''});
            }
            $scope.removeFailStatus= function(index){
              $scope.servicevo.failStatuses.splice(index,1);
            }
            $scope.addFailString = function(){
              $scope.servicevo.failStrings.push({val:''});
            }
            $scope.removeFailString= function(index){
              $scope.servicevo.failStrings.splice(index,1);
            }
            $scope.addTemplate = function() {
              $scope.servicevo.matchTemplates.push({ id: 0, val: '' });
            };

            $scope.removeTemplate = function(index) {
              $scope.servicevo.matchTemplates.splice(index, 1);
            };

            $scope.addNewRRPair = function() {
              var newItemNo = $scope.servicevo.rawpairs.length;
              $scope.servicevo.rawpairs.push({
                  id: newItemNo,
                  queriesArr: [{
                    id: 0
                  }],
                  reqHeadersArr: [{
                    id: 0
                  }],
                  resHeadersArr: [{
                    id: 0
                  }]
              });
            };

            $scope.removeRRPair = function(index) {
              $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.DEL_CONFIRM_TITLE);
              $('#genricMsg-dialog').find('.modal-body').html(ctrlConstants.DEL_CONFIRM_RRPAIR_BODY);
              $('#genricMsg-dialog').find('.modal-footer').html(ctrlConstants.DEL_CONFIRM_FOOTER);
              $('#genricMsg-dialog').modal('toggle');
              $scope.rrPairNo = index;
              $('#modal-btn-yes').on("click", function () {
                  $scope.servicevo.rawpairs.splice($scope.rrPairNo,1);
                  $scope.$apply();
                });
            };

            $scope.addNewReqHeader = function(rr) {
              var newItemNo = rr.reqHeadersArr.length;
              rr.reqHeadersArr.push({'id':newItemNo});
            };

            $scope.removeReqHeader = function(rr) {
              var lastItem = rr.reqHeadersArr.length-1;
              rr.reqHeadersArr.splice(lastItem);
            };

            $scope.addNewResHeader = function(rr) {
              var newItemNo = rr.resHeadersArr.length;
              rr.resHeadersArr.push({'id':newItemNo});
            };

            $scope.removeResHeader = function(rr) {
              var lastItem = rr.resHeadersArr.length-1;
              rr.resHeadersArr.splice(lastItem);
            };

            $scope.addQuery = function(rr) {
              var newItemNo = rr.queriesArr.length;
              rr.queriesArr.push({'id':newItemNo});
            };

            $scope.removeQuery = function(rr) {
              var lastItem = rr.queriesArr.length-1;
              rr.queriesArr.splice(lastItem);
            };

            $scope.updateService = function(servicevo) {
              try {
                if (helperFactory.isDuplicateReq(servicevo)) {
                $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.DUP_REQ_ERR_TITLE);
                $('#genricMsg-dialog').find('.modal-body').text(ctrlConstants.DUP_REQ_ERR_BODY);
                $('#genricMsg-dialog').find('.modal-footer').html(ctrlConstants.DUPLICATE_CONFIRM_FOOTER);
                $('#genricMsg-dialog').modal('toggle');
                } else {
                  apiHistoryService.publishServiceToAPI(servicevo, true);
                }
              }
              catch(e) {
                $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.PUB_FAIL_ERR_TITLE);
                $('#genricMsg-dialog').find('.modal-body').text(ctrlConstants.PUB_FAIL_SERV_SAVE_BODY);
                $('#genricMsg-dialog').find('.modal-footer').html(ctrlConstants.PUB_FAIL_SERV_SAVE_FOOTER);              
                $('#genricMsg-dialog').modal('toggle');
                $('#modal-btn-yes').on("click", function() {
                  apiHistoryService.saveServiceAsDraft(servicevo, true);
                });
              }
            };

            $scope.serviceInfo = function() {
              console.log($routeParams.id);
              $http.get('/api/services/draft/' + $routeParams.id)

              .then(function(response) {
                  var data;
                  if(response.data.mqservice)
                      data = response.data.mqservice;
                  else
                      data = response.data.service;
                  console.log(data);
                  feedbackService.displayServiceInfo(data);
                  $('#serviceInfo-modal').modal('toggle');
              })

              .catch(function(err) {
                  console.log(err);
                    $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.SERV_SAVE_FAIL_ERR_TITLE);
                    $('#genricMsg-dialog').find('.modal-body').text(ctrlConstants.SERV_INFO_NOT_FOUND);
                    $('#genricMsg-dialog').modal('toggle');
              });
            };

            $scope.setContentType = function(rr, type) {                
              if (rr.reqHeadersArr.length < 2)
                $scope.addNewReqHeader(rr);

              if (rr.resHeadersArr.length < 2)
                $scope.addNewResHeader(rr);

              // set values
              rr.reqHeadersArr[0].v = type;
              rr.resHeadersArr[0].v = type;
              
              rr.reqHeadersArr[0].k = 'Content-Type';
              rr.resHeadersArr[0].k = 'Content-Type';

              $scope.$broadcast('angucomplete-alt:changeInput', 'req-header-0', rr.reqHeadersArr[0].k);
              $scope.$broadcast('angucomplete-alt:changeInput', 'res-header-0', rr.resHeadersArr[0].k);
            };

          $scope.totalDisplayed = 10;

          $scope.loadMore = function () {
            $scope.totalDisplayed += 10;
          };

    }]) 

          
    .controller("updateController", ['$scope', '$q', '$http', '$routeParams', 'apiHistoryService', 'feedbackService', 'suggestionsService', 'helperFactory', 'ctrlConstants', 'sutService', 'authService',
        function ($scope, $q, $http, $routeParams, apiHistoryService, feedbackService, suggestionsService, helperFactory, ctrlConstants, sutService, authService) {    
          
          $scope.statusCodes = suggestionsService.getStatusCodes();
            $scope.possibleHeaders = suggestionsService.getPossibleHeaders();

            this.getService = function() {
                apiHistoryService.getServiceById($routeParams.id)

                .then(function(response) {
                    var service = response.data;
                    console.log(service);
                    $scope.servicevo = {
                      id: service._id,
                      sut: service.sut,
                      name: service.name,
                      type: service.type,
                      delay: service.delay,
                      delayMax: service.delayMax,
                      txnCount: service.txnCount,
                      basePath: service.basePath,
                      
                      
                    };
                    
                    if(service.liveInvocation){
                      
                      $scope.servicevo.remoteHost = service.liveInvocation.remoteHost;
                      $scope.servicevo.remotePort = service.liveInvocation.remotePort;
                      $scope.servicevo.remotePath = service.liveInvocation.remoteBasePath;
                      $scope.servicevo.liveInvocationCheck = service.liveInvocation.enabled;
                      $scope.servicevo.invokeSSL = service.liveInvocation.ssl;
                      //Extract and build out codes/strings for failures
                      var failStatusCodes = service.liveInvocation.failStatusCodes;
                      var failStrings = service.liveInvocation.failStrings;
                      $scope.servicevo.failStatuses = [];
                      $scope.servicevo.failStrings = [];
                      for(var i = 0; i < failStatusCodes.length; i++){
                        $scope.servicevo.failStatuses[i] = {'id': i, 'val' : failStatusCodes[i]};

                      }
                      for(var i = 0; i < failStrings.length; i++){
                        $scope.servicevo.failStrings[i] = {'id': i, 'val' : failStrings[i]};
                      }
                      if(!$scope.servicevo.failStatuses.length){
                        $scope.servicevo.failStatuses[0] = {'id': 0,val:''};  
                      }
                      if(!$scope.servicevo.failStrings.length){
                        $scope.servicevo.failStrings[0] = {'id': 0,val:''};
                      }
                      //Select correct radio
                      if(service.liveInvocation.liveFirst)
                        $scope.servicevo.liveInvokePrePost = 'PRE';
                      else  
                        $scope.servicevo.liveInvokePrePost = 'POST';
                      
                    }else{
                      $scope.servicevo.failStatuses = [];
                      $scope.servicevo.failStrings = [];
                      $scope.servicevo.failStatuses[0] = {'id': 0,val:''};      
                      $scope.servicevo.failStrings[0] = {'id': 0,val:''};
                    }
                    console.log($scope.servicevo);

                  
                  $scope.myUser = authService.getUserInfo().username;
                
                 //returning a promise from factory didnt seem to work with .then() function here, alternative solution
                     $http.get('/api/systems')
                       .then(function (response) {
                         var newsutlist = [];
                         response.data.forEach(function (sutData) {
                           var sut = {
                             name: sutData.name,
                             members: sutData.members
                           };
                           sut.members.forEach(function (memberlist) {
                             if (memberlist.includes($scope.myUser)) {
                              newsutlist.push(sut.name);
                             }
                           });
                         });
                         $scope.canEdit = function () {
                          if (newsutlist.includes($scope.servicevo.sut.name )) {
                            return true;
                          }
                          else {
                            return false;
                          }
                        };
                       })

                       .catch(function (err) {
                         console.log(err);
                       });

                    if(service.lastUpdateUser){
                      $scope.servicevo.lastUpdateUser = service.lastUpdateUser.uid;
                    }
                    if(service.createdAt){
                      $scope.servicevo.createdAt = service.createdAt;
                    }
                    if(service.updatedAt){
                      $scope.servicevo.updatedAt = service.updatedAt;
                    }

                    $scope.servicevo.matchTemplates = [];
                    $scope.servicevo.rawpairs = [];


                    if (service.matchTemplates && service.matchTemplates.length) {
                      service.matchTemplates.forEach(function(template, index) {
                        $scope.servicevo.matchTemplates.push({ id: index, val: template });
                      });
                    }
                    else {
                      $scope.servicevo.matchTemplates.push({ id: 0, val: '' });
                    }

                    var rrid = 0;
                    service.rrpairs.forEach(function(rr){
                      rr.id = rrid;
                      rr.queriesArr = [];
                      rr.reqHeadersArr = [];
                      rr.resHeadersArr = [];
                      rr.method = rr.verb;

                      if (rr.payloadType === 'JSON') {
                        rr.requestpayload = JSON.stringify(rr.reqData, null, 4);
                        rr.responsepayload = JSON.stringify(rr.resData, null, 4);

                        //Handle empty JSON object- stringify surrounds in "" 
                        if(rr.responsepayload == "\"[]\"" || rr.responsepayload == "\"{}\""){
                          rr.responsepayload = rr.responsepayload.substring(1,3);
                        }
                      }
                      else {
                        rr.requestpayload = rr.reqData;
                        rr.responsepayload = rr.resData;
                      }

                      // map object literals to arrays for Angular view
                      if (rr.reqHeaders) {
                        var reqHeads = Object.entries(rr.reqHeaders);
                        var reqHeadId = 0;
                        reqHeads.forEach(function(elem){
                          var head = {};

                          head.id = reqHeadId;
                          head.k = elem[0];
                          head.v = elem[1];

                          rr.reqHeadersArr.push(head);
                          reqHeadId++;
                        });
                      }
                      else {
                        rr.reqHeadersArr.push({ id: 0 });
                      }

                      if (rr.resHeaders) {
                        var resHeads = Object.entries(rr.resHeaders);
                        var resHeadId = 0;
                        resHeads.forEach(function(elem){
                          var head = {};

                          head.id = resHeadId;
                          head.k = elem[0];
                          head.v = elem[1];

                          rr.resHeadersArr.push(head);
                          resHeadId++;
                        });
                      }
                      else {
                        rr.resHeadersArr.push({ id: 0 });
                      }

                      if (rr.queries) {
                        var qs = Object.entries(rr.queries);
                        var qId = 0;
                        qs.forEach(function(elem){
                          var q = {};

                          q.id = qId;
                          q.k = elem[0];
                          q.v = elem[1];

                          rr.queriesArr.push(q);
                          qId++;
                        });
                      }
                      else {
                        rr.queriesArr.push({ id: 0 });
                      }

                      $scope.servicevo.rawpairs.push(rr);
                      rrid++;
                    });
                })

                .catch(function(err) {
                    console.log(err);
                });
            };
            this.getService();


            $scope.addFailStatus = function(){
              $scope.servicevo.failStatuses.push({val:''});
            }
            $scope.removeFailStatus= function(index){
              $scope.servicevo.failStatuses.splice(index,1);
            }
            $scope.addFailString = function(){
              $scope.servicevo.failStrings.push({val:''});
            }
            $scope.removeFailString= function(index){
              $scope.servicevo.failStrings.splice(index,1);
            }
            $scope.addTemplate = function() {
              $scope.servicevo.matchTemplates.push({ id: 0, val: '' });
            };

            $scope.removeTemplate = function(index) {
              $scope.servicevo.matchTemplates.splice(index, 1);
            };

            $scope.addNewRRPair = function() {
              var newItemNo = $scope.servicevo.rawpairs.length;
              $scope.servicevo.rawpairs.push({
                  id: newItemNo,
                  queriesArr: [{
                    id: 0
                  }],
                  reqHeadersArr: [{
                    id: 0
                  }],
                  resHeadersArr: [{
                    id: 0
                  }]
              });
            };

            $scope.removeRRPair = function(index) {
              $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.DEL_CONFIRM_TITLE);
              $('#genricMsg-dialog').find('.modal-body').html(ctrlConstants.DEL_CONFIRM_RRPAIR_BODY);
              $('#genricMsg-dialog').find('.modal-footer').html(ctrlConstants.DEL_CONFIRM_FOOTER);
              $('#genricMsg-dialog').modal('toggle');
              $scope.rrPairNo = index;
              $('#modal-btn-yes').on("click", function () {
                  $scope.servicevo.rawpairs.splice($scope.rrPairNo,1);
                  $scope.$apply();
                });
            };

            $scope.addNewReqHeader = function(rr) {
              var newItemNo = rr.reqHeadersArr.length;
              rr.reqHeadersArr.push({'id':newItemNo});
            };

            $scope.removeReqHeader = function(rr) {
              var lastItem = rr.reqHeadersArr.length-1;
              rr.reqHeadersArr.splice(lastItem);
            };

            $scope.addNewResHeader = function(rr) {
              var newItemNo = rr.resHeadersArr.length;
              rr.resHeadersArr.push({'id':newItemNo});
            };

            $scope.removeResHeader = function(rr) {
              var lastItem = rr.resHeadersArr.length-1;
              rr.resHeadersArr.splice(lastItem);
            };

            $scope.addQuery = function(rr) {
              var newItemNo = rr.queriesArr.length;
              rr.queriesArr.push({'id':newItemNo});
            };

            $scope.removeQuery = function(rr) {
              var lastItem = rr.queriesArr.length-1;
              rr.queriesArr.splice(lastItem);
            };

            $scope.updateService = function(servicevo) {
              try {
                if (helperFactory.isDuplicateReq(servicevo)) {
                $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.DUP_REQ_ERR_TITLE);
                $('#genricMsg-dialog').find('.modal-body').text(ctrlConstants.DUP_REQ_ERR_BODY);
                $('#genricMsg-dialog').find('.modal-footer').html(ctrlConstants.DUPLICATE_CONFIRM_FOOTER);
                $('#genricMsg-dialog').modal('toggle');
                } else {
                  apiHistoryService.publishServiceToAPI(servicevo, true);
                }
              }
              catch(e) {
                $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.PUB_FAIL_ERR_TITLE);
                $('#genricMsg-dialog').find('.modal-body').text(ctrlConstants.PUB_FAIL_ERR_BODY);
                $('#genricMsg-dialog').modal('toggle');
              }
            };

            $scope.setContentType = function(rr, type) {                
              if (rr.reqHeadersArr.length < 2)
                $scope.addNewReqHeader(rr);

              if (rr.resHeadersArr.length < 2)
                $scope.addNewResHeader(rr);

              // set values
              rr.reqHeadersArr[0].v = type;
              rr.resHeadersArr[0].v = type;
              
              rr.reqHeadersArr[0].k = 'Content-Type';
              rr.resHeadersArr[0].k = 'Content-Type';

              $scope.$broadcast('angucomplete-alt:changeInput', 'req-header-0', rr.reqHeadersArr[0].k);
              $scope.$broadcast('angucomplete-alt:changeInput', 'res-header-0', rr.resHeadersArr[0].k);
            };

            $scope.serviceInfo = function() {
              console.log($routeParams.id);
              $http.get('/api/services/' + $routeParams.id)

              .then(function(response) {
                  var data = response.data;
                  console.log(data);
                  feedbackService.displayServiceInfo(data);
                  $('#serviceInfo-modal').modal('toggle');
              })

              .catch(function(err) {
                  console.log(err);
                    $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.PUB_FAIL_ERR_TITLE);
                    $('#genricMsg-dialog').find('.modal-body').text(ctrlConstants.PUB_FAIL_ERR_BODY);
                    $('#genricMsg-dialog').modal('toggle');
              });
            };

          $scope.totalDisplayed = 10;

          $scope.loadMore = function () {
            $scope.totalDisplayed += 10;
          };

          //To Show Service Success Modal when a new service is created.
          if($routeParams.frmWher=='frmServCreate'){
            $http.get('/api/services/' + $routeParams.id)
              .then(function(response) {
                  var data = response.data;
                  console.log(data);
                  feedbackService.displayServiceInfo(data);
              })
              .catch(function(err) {
                  console.log(err);
                    $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.PUB_FAIL_ERR_TITLE);
                    $('#genricMsg-dialog').find('.modal-body').text(ctrlConstants.PUB_FAIL_ERR_BODY);
                    $('#genricMsg-dialog').modal('toggle');
              });
            $('#success-modal').modal('toggle');
          }
    }])

    .controller("selectServiceController", ['$scope', 'apiHistoryService','authService',
    function($scope,apiHistoryService,authService){
      $scope.serviceList = [];
      apiHistoryService.getRecentModifiedServices(5,authService.getUserInfo().username).then(function(response){
        var data = response.data;
        $scope.serviceList = data;
        console.log(data);
      });
    }])
    .controller("recorderListController", ['$scope', '$http', '$timeout', 'sutService', 'feedbackService', 'apiHistoryService', 'userService', 'authService', 'FileSaver', 'Blob', 'ctrlConstants', 
    function($scope,$http,$timeout,sutService,feedbackService,apiHistoryService,userService,authService,FileSaver,Blob,ctrlConstants){
      $scope.sutlist = sutService.getAllSUT();
      $scope.userlist = userService.getAllUsers();
      $scope.recordingList = [];
      apiHistoryService.getRecordings().then(function(response){
        var data = response.data;
        $scope.recordingList = data;
      });


      $scope.deleteRecording = function (recording) {
        $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.DEL_CONFIRM_TITLE);
        $('#genricMsg-dialog').find('.modal-body').html(ctrlConstants.DEL_REC_CONFIRM_BODY);
        $('#genricMsg-dialog').find('.modal-footer').html(ctrlConstants.DEL_CONFIRM_FOOTER);
        $('#genricMsg-dialog').modal('toggle');
        $('#modal-btn-yes').on("click", function () {
          apiHistoryService.deleteRecording(recording._id)
            .then(function (response) {

              $scope.recordingList.forEach(function (elem, i, arr) {
                if (elem._id === recording._id)
                  arr.splice(i, 1);
              });
            })
            .catch(function (err) {
              console.log(err);
            });
        });
      };


    }])

    .controller("serviceHistoryController", ['$scope', '$http', '$timeout', 'sutService', 'feedbackService', 'apiHistoryService', 'userService', 'authService', 'FileSaver', 'Blob', 'ctrlConstants', 
        function($scope,$http,$timeout,sutService,feedbackService,apiHistoryService,userService,authService,FileSaver,Blob,ctrlConstants){
            $scope.sutlist = sutService.getAllSUT();
            $scope.userlist = userService.getAllUsers();
            $scope.servicelist = [];

            //script to retroactively assign group member. not needed for the future.
            $scope.script=function(){
              console.log("starting script");
              var sutnames = [];
              $http.get('/api/systems')
                .then(function (response) {
                  response.data.forEach(function (sutData) {
                    var sut = {
                      name: sutData.name,
                      members: sutData.members
                    };
                    sutnames.push(sut.name);
                  });
                })

                .catch(function (err) {
                  console.log(err);
                });

              $http.get('/api/services')
                .then(function (response) {
                  console.log(response.data);
                  for (var i = 0; i < response.data.length; i++) {
                    var owner = ["mockiato", response.data[i].user.uid];//change superuser name if neccesary
                    var sut = response.data[i].sut.name;
                    
                    if (sutnames.includes(sut)){
                      console.log("------------------------------------");
                      console.log("sut "+ sut + " exists");
                      console.log(owner + " will be added to group: " + sut);
                      sutService.updateGroup(sut, owner);
                    }
                    else{
                      console.log("------------------------------------");
                      console.log("sut " + sut + " does not exist");
                    }
                  }
                })

                .catch(function (err) {
                  console.log(err);
                });
            }
            ///////////////////////////end script. to remove

          
             $scope.filtersSelected = function(sut, user) {
                  if (sut && !user) {
                    console.log("newSut: " + sut + "name: " + sut.name);
                   apiHistoryService.getServiceForSUT(sut.name)

                      .then(function(response) {
                          var data = response.data;
                          console.log(data);
                          $scope.servicelist = data;
                        })

                      .catch(function(err) {
                          console.log(err);
                      });
                      
                  }

                  else if (user && !sut) {
                      apiHistoryService.getServiceByUser(user.name)

                      .then(function(response) {
                        var data = response.data;
                        console.log(data);
                        $scope.servicelist = data;
                      })

                      .catch(function(err) {
                          console.log(err);
                      });
                  }

                  else if (newUser && newSut) {
                      apiHistoryService.getServicesFiltered(sut.name, user.name)

                      .then(function(response) {
                        var data = response.data;
                        console.log(data);
                        $scope.servicelist = data;
                      })

                      .catch(function(err) {
                          console.log(err);
                      });
                  }
              });
            $scope.filtersSelected(null, { name: authService.getUserInfo().username });

            $scope.clearSelected = function() {
              $scope.selectedSut = null;
              $scope.selectedUser = null;
              $scope.servicelist = [];
            };

          //returning a promise from factory didnt seem to work with .then() function here, alternative solution
          $http.get('/api/systems')
            .then(function (response) {
              $scope.myUser = authService.getUserInfo().username;
              $scope.myGroups = [];
              response.data.forEach(function (sutData) {
                var sut = {
                  name: sutData.name,
                  members: sutData.members
                };
                sut.members.forEach(function (memberlist) {
                  if (memberlist.includes($scope.myUser)) {
                    $scope.myGroups.push(sut.name);
                  }
                });
              });
            })

            .catch(function (err) {
              console.log(err);
            });

          $scope.deleteService = function (service) {
            $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.DEL_CONFIRM_TITLE);
            $('#genricMsg-dialog').find('.modal-body').html(ctrlConstants.DEL_CONFIRM_BODY);
            $('#genricMsg-dialog').find('.modal-footer').html(ctrlConstants.DEL_CONFIRM_FOOTER);
            $('#genricMsg-dialog').modal('toggle');
            $('#modal-btn-yes').on("click", function () {
              apiHistoryService.deleteServiceAPI(service)
                .then(function (response) {
                  var data = response.data;
                  console.log(data);
                  $scope.servicelist.forEach(function (elem, i, arr) {
                    if (elem._id === data.id)
                      arr.splice(i, 1);
                  });
                })
                .catch(function (err) {
                  console.log(err);
                });
            });
          };

            $scope.toggleService = function(service) {
                apiHistoryService.toggleServiceAPI(service)

                .then(function(response) {
                    var data = response.data;
                    console.log(data);
                    service.running = !service.running;
                })

                .catch(function(err) {
                    console.log(err);
                });
            };

            $scope.exportService = function(serv) {
                // clone the service
                var service = JSON.parse(JSON.stringify(serv));

                // clean up data before export
                delete service._id;
                delete service.sut._id;
                delete service.user;
                delete service.__v;
                delete service.$$hashKey;

                if (service.basePath) {
                  service.basePath = service.basePath.replace('/' + service.sut.name, '');
                }
                
                service.rrpairs.forEach(function(rr) {
                  delete rr._id;
                });

                var data = new Blob([JSON.stringify(service, null, "  ")], { type: 'application/json;charset=utf-8' });
                FileSaver.saveAs(data, service.name + '.json');
            };

            $scope.serviceInfo = function(serviceID) {
              console.log('printing service id: ' + serviceID);
                $http.get('/api/services/' + serviceID)

                .then(function(response) {
                    var data = response.data;
                    console.log(data);
                    feedbackService.displayServiceInfo(data);
                    $('#serviceInfo-modal').modal('toggle');
                })

                .catch(function(err) {
                    console.log(err);
                      $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.PUB_FAIL_ERR_TITLE);
                      $('#genricMsg-dialog').find('.modal-body').text(ctrlConstants.PUB_FAIL_ERR_BODY);
                      $('#genricMsg-dialog').modal('toggle');
                });
            };
    }])

    .controller("dataGenController", ['$scope', '$parse', 'FileSaver', 'Blob', 'genDataService', 'ctrlConstants', 
      function($scope, $parse, FileSaver, Blob, genDataService, ctrlConstants){
          $scope.addColumn = newColumn;
          $scope.numRows= 100;
          $scope.gen = {};
          $scope.gen.columns = [];

          //setting some default vals
          $scope.idBool = true;
          $scope.fileType = 'JSON';
          $scope.rowOffset = 0;

          function mapJSON(){
            var dataArr = [];

            for(var c=0; c < $scope.numRows + 1; c++){
              if($scope.idBool){
                var id = $scope.rowOffset;
                dataArr.forEach(function (newJobItem){
                  newJobItem.id = id++;
                });
              }

              for(var i=0; i < $scope.gen.columns.length; i++){
                dataArr.forEach(function (hVal){
                  var header = $scope.gen.columns[i].header;
                  var dataType = $scope.gen.columns[i].dataType;
                  hVal[header] = genDataService.getDataType(dataType);
                });
              }
              dataArr.push({});
            }

            var lastItem = dataArr.length-1;
            dataArr.splice(lastItem);
            return dataArr;
          };

          function mapCSV(){
              var json = mapJSON()
              var fields = Object.keys(json[0])
              var replacer = function(key, value) { return value === null ? '' : value }
              var csv = json.map(function(row){
                return fields.map(function(fieldName){
                  return JSON.stringify(row[fieldName], replacer)
                }).join(',')
              })
              csv.unshift(fields.join(',')) // add header column

              return csv.join('\r\n');
          };

          function map_dl_XML(){
            xmlData = genDataService.json2xml(mapJSON());
            var blob = new Blob([xmlData], {type : 'text/xml;charset=utf-8;'});
            FileSaver.saveAs(blob, 'mockiato-data.xml');
          };

          $scope.printColumns = function() {
                if($scope.numRows > 1000){
                  return alert(ctrlConstants.DATAGEN_ALERT_MSG_1000ROWS);
                }

                if($scope.fileType == "JSON"){
                  downloadJSON(mapJSON());
                }
                else if($scope.fileType == "CSV"){
                  downloadCSV(mapCSV());
                }

                else if($scope.fileType == "XML"){
                  map_dl_XML();
                }

                else {
                  alert("No integration for that file type yet");
                }
          };

          function newColumn() {
              $scope.gen.columns.push({});
          };

          $scope.remColumn = function() {
              var lastItem = $scope.gen.columns.length-1;
              $scope.gen.columns.splice(lastItem);
          };

          function downloadCSV(data){
              var exportFilename = 'mockiato-data';
              var csvData = new Blob([data], {type: 'text/csv;charset=utf-8;'});
              //IE11 & Edge
              if (navigator.msSaveBlob) {
                  navigator.msSaveBlob(csvData, exportFilename);
              } else {
                  //In FF link must be added to DOM to be clicked
                  var link = document.createElement('a');
                  link.href = window.URL.createObjectURL(csvData);
                  link.setAttribute('download', exportFilename);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
              }

          };

          function downloadJSON(data){
            var blob = new Blob([JSON.stringify(data, null, "   ")], {type : 'application/json'});
            FileSaver.saveAs(blob, 'mockiato-data.json');
          };

          //setting some default vals
          newColumn();
          $scope.gen.columns[0].header = 'first_name';
          $scope.gen.columns[0].dataType = 'First Name';

          newColumn();
          $scope.gen.columns[1].header = 'last_name';
          $scope.gen.columns[1].dataType = 'Last Name';

          newColumn();
          $scope.gen.columns[2].header = 'email';
          $scope.gen.columns[2].dataType = 'Email Address';

    }])

    .controller("adminController", ['$scope', 'authService', 'userService', 'sutService', 'ctrlConstants',
      function ($scope, authService, userService, sutService, ctrlConstants){
        $scope.myUser = authService.getUserInfo().username;
        $scope.sutlist = sutService.getGroupsByUser($scope.myUser);
        $scope.userlist = userService.getAllUsers();
        $scope.selectedSut = [];
        $scope.allSUT = sutService.getAllSUT();
        $scope.deleteSutList = sutService.getGroupsToBeDeleted($scope.myUser);

      $scope.checkAndAddGroup = function (createSut) {
        var count = 0;
        $scope.createGroupMessage = "";
        for (var i = 0; i < $scope.allSUT.length; i++) {
          if ($scope.allSUT[i].name.toUpperCase() == $scope.createSut.name.toUpperCase()) {
            count++;
          }
        }
        if (count != 0) {
          $scope.createGroupMessage = ctrlConstants.GRP_ALREADY_EXIST_MSG;
        }
        else {
          sutService.addGroup($scope.createSut);
          $scope.createGroupMessage = ctrlConstants.GRP_CREATED_SUCCESS_MSG;
          
        }
        window.location.reload(true);
      };
   
        $scope.removeGroup = function (deleteSut) {
        sutService.deleteGroup( deleteSut);
            $scope.deleteGroupMessage = ctrlConstants.GRP_DELETION_SUCCESS_MSG; 
            window.location.reload(true);
          }; 



  
        $scope.$watch('selectedSut', function (newSut) {
          if ($scope.selectedSut != ""){ //removes null response, saves resources
            $scope.memberlist = sutService.getMembers(newSut.name);
          
            //disallows duplicate user add
            $scope.removeMembers = function (users) {
              return $scope.memberlist.indexOf(users.name) === -1;
            }
          }
        });

        $scope.saveGroup = function (selectedSut) {
          sutService.updateGroup(selectedSut.name, $scope.memberlist);
        };

        $scope.addMember = function () {
          $scope.memberlist.push($scope.member.name);
          $scope.saveGroup($scope.selectedSut);
        }

        $scope.removeMember = function (index) {
          $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.DEL_CONFIRM_TITLE);
          $('#genricMsg-dialog').find('.modal-body').html(ctrlConstants.DEL_CONFIRM_USER_BODY);
          $('#genricMsg-dialog').find('.modal-footer').html(ctrlConstants.DEL_CONFIRM_FOOTER);
          $('#genricMsg-dialog').modal('toggle');
          $scope.userNo = index;
          $('#modal-btn-yes').on("click", function () {
            $scope.memberlist.splice($scope.userNo, 1);
            $scope.$apply();
            $scope.saveGroup($scope.selectedSut);
          });
        };

      }])


    .controller("mainController", ['$rootScope', '$location', 'authService', 'ctrlConstants', 
        function($rootScope,$location,authService,ctrlConstants){
            if (window.location.port)
              $rootScope.mockiatoHost = 'http://' + window.location.hostname + ':' + window.location.port;
            else
              $rootScope.mockiatoHost = 'http://' + window.location.hostname;

            $rootScope.virt = {
              baseUrl: '',
              type: ''
            };
            $rootScope.virt.operations = [];

            $rootScope.$on("$routeChangeSuccess", function(userInfo) {
                console.log(userInfo);
                $rootScope.virt.operations = [];
            });

            $rootScope.$on("$routeChangeError", function(event, current, previous, eventObj) {
                if (eventObj.authenticated === false) {
                    $location.path("/login");
                }
            });

            $rootScope.logout = function() {
                authService.logout();
                $location.path("/login");
            };

            if (location.href.indexOf('#regS') !== -1) {
              $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.REG_SUCCESS_TITLE);
              $('#genricMsg-dialog').find('.modal-body').html(ctrlConstants.REG_SUCCESS_BODY);
              $('#genricMsg-dialog').find('.modal-footer').html(ctrlConstants.CLOSE_PRMRY_BTN_FOOTER);
              $('#genricMsg-dialog').modal('toggle');
            }
    }])

    .controller("bulkUploadController", ['$scope', 'sutService' , 'authService', 'zipUploadAndExtractService', 'publishExtractedRRPairService', 'ctrlConstants', 
      function ($scope, sutService, authService, zipUploadAndExtractService, publishExtractedRRPairService, ctrlConstants) {
      $scope.myUser = authService.getUserInfo().username;
      $scope.sutlist = sutService.getGroupsByUser($scope.myUser);
      $scope.bulkUpload = {};
      $scope.uploadAndExtractZip = function () {
        $scope.uploadSuccessMessage = "";
        $scope.uploadErrMessage = "";
        $scope.uploaded_file_name_id = "";
        if ($scope.uploadRRPair) {
          $scope.uploadSuccessMessage = "";
          $scope.uploadErrMessage = "";
          if($scope.uploadRRPair.name.endsWith(".zip"))
          {
            zipUploadAndExtractService.zipUploadAndExtract($scope.uploadRRPair, function (file_upload_name_id) {
              if (file_upload_name_id) {
                $scope.uploadSuccessMessage = ctrlConstants.BULK_UPLOAD_SUCCESS_MSG + $scope.uploadRRPair.name;
                $scope.uploadErrMessage = ""
                $scope.uploaded_file_name_id = file_upload_name_id;
              } else {
                $scope.uploadErrMessage = ctrlConstants.BULK_UPLOAD_FAILURE_MSG + $scope.uploadRRPair.name;
                $scope.uploadSuccessMessage = "";
              }
            });
          }
          else{
            $scope.uploadErrMessage = ctrlConstants.BULK_UPLOAD_FILE_TYPE_FAILURE_MSG + $scope.uploadRRPair.name;
            $scope.uploadSuccessMessage = "";
          }
        }
      };
      $scope.publishExtractedRRPairFiles = function (bulkUpload) {
        publishExtractedRRPairService.publishExtractedRRPair(bulkUpload, $scope.uploaded_file_name_id, function (message){
          $scope.uploadErrMessage = message;
          $scope.uploadSuccessMessage = "";
        });
      };
}])

.controller("specController", ['$scope','$routeParams' , 'sutService', 'authService', 'specUploadService', 'publishSpecService', 'ctrlConstants', 
        function($scope, $routeParams, sutService, authService, specUploadService, publishSpecService, ctrlConstants) {
          $scope.myUser = authService.getUserInfo().username;
          $scope.sutlist = sutService.getGroupsByUser($scope.myUser);
          $scope.spec = {}; 
          $scope.spec.type = $routeParams.specType;
          if ($scope.spec.type == 'openapi') { $scope.spec.heading = 'OpenAPI' } else if ($scope.spec.type == 'wsdl') { $scope.spec.heading = 'WSDL' }

          
          $scope.callUploadSpec = function () {
            $scope.uploadSuccessMessage = "";
            $scope.uploadErrMessage = "";
            $scope.uploaded_file_name_id = "";
            if ($scope.uploadSpec) {
              $scope.uploadSuccessMessage = "";
              $scope.uploadErrMessage = "";
              if (($scope.spec.type == 'openapi' && ($scope.uploadSpec.name.endsWith(".yaml") || $scope.uploadSpec.name.endsWith(".yml") || $scope.uploadSpec.name.endsWith(".json")))
                || ($scope.spec.type == 'wsdl' && $scope.uploadSpec.name.endsWith(".wsdl"))) {
                specUploadService.specUpload($scope.uploadSpec, function (uploaded_file_id) {
                  if (uploaded_file_id) {
                    $scope.uploadSuccessMessage = ctrlConstants.SPEC_UPLOAD_SUCCESS_MSG + $scope.uploadSpec.name;
                    $scope.uploaded_file_id = uploaded_file_id;
                    $scope.uploadErrMessage = "";
                  } else {
                    $scope.uploadErrMessage = ctrlConstants.SPEC_UPLOAD_FAILURE_MSG + $scope.uploadSpec.name;
                    $scope.uploadSuccessMessage = "";
                  }
                });
              }
              else {
                $scope.uploadErrMessage = ctrlConstants.SPEC_FILE_TYPE_UPLOAD_ERROR + $scope.uploadSpec.name;
                $scope.uploadSuccessMessage = "";
              }
            }
          };
          
          $scope.publishspec = function (spec) {
            $scope.uploadSuccessMessage = "";
            $scope.uploadErrMessage = "";
            $scope.flag = false;
            //conditions are complex here. Any change will break validations. - Pradeep
            if ((typeof spec.url !== 'undefined' && spec.url !== "" && $scope.spec.type == 'openapi' && (spec.url.endsWith(".yaml") || spec.url.endsWith(".yml") || spec.url.endsWith(".json")))
              || (typeof spec.url !== 'undefined' && spec.url !== "" && $scope.spec.type == 'wsdl' && spec.url.endsWith("?wsdl"))
              || ((typeof spec.url == 'undefined' || spec.url == "") && $scope.uploadSpec && $scope.spec.type == 'openapi' && ($scope.uploadSpec.name.endsWith(".yaml") || $scope.uploadSpec.name.endsWith(".yml")  || $scope.uploadSpec.name.endsWith(".json")))
              || ((typeof spec.url == 'undefined' || spec.url == "") && $scope.uploadSpec && $scope.spec.type == 'wsdl' && $scope.uploadSpec.name.endsWith(".wsdl"))
            ) {
              var filename; var file_id;
              if ($scope.uploadSpec || $scope.uploaded_file_id) {
                file_id = $scope.uploaded_file_id;
                filename = $scope.uploadSpec.name;
              } else {
                file_id = "";
                filename = "";
              }
              publishSpecService.publishSpec(spec, file_id, filename, function(message){
                if(message == 'twoSeviceDiffNameSameBasePath')
                { $scope.flag= true;}
              });
            } else {
              $scope.uploadErrMessage = ctrlConstants.SPEC_FILE_TYPE_URL_PUBLISH_ERROR;
              $scope.uploadSuccessMessage = "";
            }
          };
    }])

    .controller("deletedServiceController", ['$scope', '$http', '$timeout', 'sutService', 'feedbackService', 'apiHistoryService', 'userService', 'authService', 'FileSaver', 'Blob', 'ctrlConstants', 
        function($scope,$http,$timeout,sutService,feedbackService,apiHistoryService,userService,authService,FileSaver,Blob,ctrlConstants){
            $scope.sutlist = sutService.getAllSUT();
            $scope.userlist = userService.getAllUsers();
            $scope.servicelist = [];

            //script to retroactively assign group member. not needed for the future.
            $scope.script=function(){
              console.log("starting script");
              var sutnames = [];
              $http.get('/api/systems')
                .then(function (response) {
                  response.data.forEach(function (sutData) {
                    var sut = {
                      name: sutData.name,
                      members: sutData.members
                    };
                    sutnames.push(sut.name);
                  });
                })

                .catch(function (err) {
                  console.log(err);
                });

              $http.get('/api/services/archive')
                .then(function (response) {
                  console.log(response.data);
                  for (var i = 0; i < response.data.length; i++) {
                    var owner = response.data[i].user.uid;
                    var sut = response.data[i].sut.name;
                    
                    if (sutnames.includes(sut)){
                      console.log("sut "+ sut + " exists");
                      console.log(owner + " will be added to group: " + sut);
                      sutService.updateGroup(sut, owner);
                    }
                    else{
                      console.log("sut " + sut + " does not exist");
                    }
                  }
                })

                .catch(function (err) {
                  console.log(err);
                });
            }
            ///////////////////////////end script. to remove

            $scope.filtersSelected = function(sut, user) {
                if (sut && !user) {
                    apiHistoryService.getServiceForArchiveSUT(sut.name)

                    .then(function(response) {
                        var data = response.data;
                        console.log(data);
                        var arryListOfService=[];
                      for (let i = 0; i < data.length; i++) {
                        if(data[i].service)arryListOfService.push(data[i].service);
                        if(data[i].mqservice)arryListOfService.push(data[i].mqservice);
                      }
                        $scope.servicelist = arryListOfService;
                      })

                    .catch(function(err) {
                        console.log(err);
                    });
                }

                else if (user && !sut) {
                    apiHistoryService.getServiceByArchiveUser(user.name)
                    .then(function(response) {
                      var data = response.data;
                      console.log(data);
                      var arryListOfService=[];
                      for (let i = 0; i < data.length; i++) {
                        if(data[i].service)arryListOfService.push(data[i].service);
                        if(data[i].mqservice)arryListOfService.push(data[i].mqservice);
                      }
                      $scope.servicelist = arryListOfService;
                    })

                    .catch(function(err) {
                        console.log(err);
                    });
                }

                else if (user && sut) {
                    apiHistoryService.getServicesArchiveFiltered(sut.name, user.name)

                    .then(function(response) {
                      var data = response.data;
                      console.log(data);
                      var arryListOfService=[];
                      for (let i = 0; i < data.length; i++) {
                        if(data[i].service)arryListOfService.push(data[i].service);
                        if(data[i].mqservice)arryListOfService.push(data[i].mqservice);
                      }
                      $scope.servicelist = arryListOfService;
                    })

                    .catch(function(err) {
                        console.log(err);
                    });
                }

            };
            $scope.filtersSelected(null, { name: authService.getUserInfo().username });

            $scope.clearSelected = function() {
              $scope.selectedSut = null;
              $scope.selectedUser = null;
              $scope.servicelist = [];
            };

          //returning a promise from factory didnt seem to work with .then() function here, alternative solution
          $http.get('/api/systems')
            .then(function (response) {
              $scope.myUser = authService.getUserInfo().username;
              $scope.myGroups = [];
              response.data.forEach(function (sutData) {
                var sut = {
                  name: sutData.name,
                  members: sutData.members
                };
                sut.members.forEach(function (memberlist) {
                  if (memberlist.includes($scope.myUser)) {
                    $scope.myGroups.push(sut.name);
                  }
                });
              });
            })

            .catch(function (err) {
              console.log(err);
            });


          $http.get('/api/users/admin')
            .then(function (response) {
              $scope.adminUser = response.data;
            })

            .catch(function (err) {
              console.log(err);
            });

          $scope.deleteArchiveService = function (service) {
            $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.DEL_CONFIRM_TITLE);
            $('#genricMsg-dialog').find('.modal-body').html(ctrlConstants.DEL_Permanent_CONFIRM_BODY);
            $('#genricMsg-dialog').find('.modal-footer').html(ctrlConstants.DEL_CONFIRM_FOOTER);
            $('#genricMsg-dialog').modal('toggle');
            $('#modal-btn-yes').on("click", function () {
              apiHistoryService.deleteServiceArchive(service)
                .then(function (response) {
                  var data = response.data;
                  console.log(data);
                  $scope.servicelist.forEach(function (elem, i, arr) {
                    if (elem._id === data.id)
                      arr.splice(i, 1);
                  });
                })
                .catch(function (err) {
                  console.log(err);
                });
            });
          };

          $scope.restoreService = function (service) {
            $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.RESTORE_CONFIRM_TITLE);
            $('#genricMsg-dialog').find('.modal-body').html(ctrlConstants.RESTORE_CONFIRM_BODY);
            $('#genricMsg-dialog').find('.modal-footer').html(ctrlConstants.DEL_CONFIRM_FOOTER);
            $('#genricMsg-dialog').modal('toggle');
            $('#modal-btn-yes').on("click", function () {
              apiHistoryService.restoreService(service)
                .then(function (response) {
                  var data = response.data;
                  console.log(data);
                  $scope.servicelist.forEach(function (elem, i, arr) {
                    if (elem._id === data.id)
                      arr.splice(i, 1);
                  });
                })
                .catch(function (err) {
                  console.log(err);
                });
            });
          };

            $scope.exportService = function(serv) {
                // clone the service
                var service = JSON.parse(JSON.stringify(serv));

                // clean up data before export
                delete service._id;
                delete service.sut._id;
                delete service.user;
                delete service.__v;
                delete service.$$hashKey;

                if (service.basePath) {
                  service.basePath = service.basePath.replace('/' + service.sut.name, '');
                }
                
                service.rrpairs.forEach(function(rr) {
                  delete rr._id;
                });

                var data = new Blob([JSON.stringify(service, null, "  ")], { type: 'application/json;charset=utf-8' });
                FileSaver.saveAs(data, service.name + '.json');
            };

            $scope.serviceInfo = function(serviceID) {
              console.log('printing service id: ' + serviceID);
                $http.get('/api/services/infoFrmArchive/' + serviceID)
                .then(function(response) {
                    var data = response.data;
                    console.log(data);
                    if(data.service)feedbackService.displayServiceInfo(data.service);
                    if(data.mqservice)feedbackService.displayServiceInfo(data.mqservice);
                    $('#serviceInfo-modal').modal('toggle');
                })
                .catch(function(err) {
                    console.log(err);
                      $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.PUB_FAIL_ERR_TITLE);
                      $('#genricMsg-dialog').find('.modal-body').text(ctrlConstants.PUB_FAIL_ERR_BODY);
                      $('#genricMsg-dialog').modal('toggle');
                });
            };
    }]);

    // .controller("draftServiceController", ['$scope', '$http', '$timeout', 'sutService', 'feedbackService', 'apiHistoryService', 'userService', 'authService', 'FileSaver', 'Blob', 'ctrlConstants', 
    // function($scope,$http,$timeout,sutService,feedbackService,apiHistoryService,userService,authService,FileSaver,Blob,ctrlConstants){
    //     $scope.sutlist = sutService.getAllSUT();
    //     $scope.userlist = userService.getAllUsers();
    //     $scope.servicelist = [];

    //     //script to retroactively assign group member. not needed for the future.
    //     $scope.script=function(){
    //       console.log("starting script");
    //       var sutnames = [];
    //       $http.get('/api/systems')
    //         .then(function (response) {
    //           response.data.forEach(function (sutData) {
    //             var sut = {
    //               name: sutData.name,
    //               members: sutData.members
    //             };
    //             sutnames.push(sut.name);
    //           });
    //         })

    //         .catch(function (err) {
    //           console.log(err);
    //         });

    //       $http.get('/api/services/draft')
    //         .then(function (response) {
    //           console.log(response.data);
    //           for (var i = 0; i < response.data.length; i++) {
    //             var owner = response.data[i].user.uid;
    //             var sut = response.data[i].sut.name;
                
    //             if (sutnames.includes(sut)){
    //               console.log("sut "+ sut + " exists");
    //               console.log(owner + " will be added to group: " + sut);
    //               sutService.updateGroup(sut, owner);
    //             }
    //             else{
    //               console.log("sut " + sut + " does not exist");
    //             }
    //           }
    //         })

    //         .catch(function (err) {
    //           console.log(err);
    //         });
    //     }
    //     ///////////////////////////end script. to remove

    //     $scope.filtersSelected = function(sut, user) {
    //         if (sut && !user) {
    //             apiHistoryService.getServiceForDraftSUT(sut.name)

    //             .then(function(response) {
    //                 var data = response.data;
    //                 console.log(data);
    //                 var arryListOfService=[];
    //               for (let i = 0; i < data.length; i++) {
    //                 if(data[i].service)arryListOfService.push(data[i].service);
    //                 if(data[i].mqservice)arryListOfService.push(data[i].mqservice);
    //               }
    //                 $scope.servicelist = arryListOfService;
    //               })

    //             .catch(function(err) {
    //                 console.log(err);
    //             });
    //         }

    //         else if (user && !sut) {
    //             apiHistoryService.getServiceByDraftUser(user.name)
    //             .then(function(response) {
    //               var data = response.data;
    //               console.log(data);
    //               var arryListOfService=[];
    //               for (let i = 0; i < data.length; i++) {
    //                 if(data[i].service)arryListOfService.push(data[i].service);
    //                 if(data[i].mqservice)arryListOfService.push(data[i].mqservice);
    //               }
    //               $scope.servicelist = arryListOfService;
    //             })

    //             .catch(function(err) {
    //                 console.log(err);
    //             });
    //         }

    //         else if (user && sut) {
    //             apiHistoryService.getServicesDraftFiltered(sut.name, user.name)

    //             .then(function(response) {
    //               var data = response.data;
    //               console.log(data);
    //               var arryListOfService=[];
    //               for (let i = 0; i < data.length; i++) {
    //                 if(data[i].service)arryListOfService.push(data[i].service);
    //                 if(data[i].mqservice)arryListOfService.push(data[i].mqservice);
    //               }
    //               $scope.servicelist = arryListOfService;
    //             })

    //             .catch(function(err) {
    //                 console.log(err);
    //             });
    //         }

    //       //returning a promise from factory didnt seem to work with .then() function here, alternative solution
    //         $http.get('/api/systems')
    //           .then(function (response) {
    //             $scope.myUser = authService.getUserInfo().username;
    //              $scope.myGroups = [];
    //             response.data.forEach(function (sutData) {
    //               var sut = {
    //                 name: sutData.name,
    //                 members: sutData.members
    //               };
    //               sut.members.forEach(function (memberlist) {
    //                 if (memberlist.includes($scope.myUser)) {
    //                   $scope.myGroups.push(sut.name);
    //                 }
    //               });
    //             });
    //           })

    //           .catch(function (err) {
    //             console.log(err);
    //           });


    //           $http.get('/api/users/admin')
    //             .then(function(response) {
    //                 $scope.adminUser = response.data;
    //                 })

    //           .catch(function(err) {
    //               console.log(err);
    //           });

    //     };
    //     $scope.filtersSelected(null, { name: authService.getUserInfo().username });

    //     $scope.clearSelected = function() {
    //       $scope.selectedSut = null;
    //       $scope.selectedUser = null;
    //       $scope.servicelist = [];
    //     };

    //   $scope.deleteDraftService = function (service) {
    //     $('#genricMsg-dialog').find('.modal-title').text(ctrlConstants.DEL_CONFIRM_TITLE);
    //     $('#genricMsg-dialog').find('.modal-body').html(ctrlConstants.DEL_DRAFTSERVICE_BODY);
    //     $('#genricMsg-dialog').find('.modal-footer').html(ctrlConstants.DEL_CONFIRM_FOOTER);
    //     $('#genricMsg-dialog').modal('toggle');
    //     $('#modal-btn-yes').on("click", function () {
    //       apiHistoryService.deleteDraftService(service)
    //         .then(function (response) {
    //           var data = response.data;
    //           console.log(data);
    //           $scope.servicelist.forEach(function (elem, i, arr) {
    //             if (elem._id === data.id)
    //               arr.splice(i, 1);
    //           });
    //         })
    //         .catch(function (err) {
    //           console.log(err);
    //         });
    //     });
    //   };

    // }]);

//Put all the hard coding or constants here for controller.      
ctrl.constant("ctrlConstants", {
  "DUP_REQ_ERR_TITLE" : "Duplicate Request Error",
  "DUP_REQ_ERR_BODY" : "Two Requests are same. Either change request data or relative path of duplicate requests.",
  "PUB_FAIL_ERR_TITLE" : "Publish Failure Error",
  "PUB_FAIL_ERR_BODY" : "Please ensure your request / response pairs are well formed.",
  "DUP_RECORDER_PATH_TITLE" : "Publish Failure: Duplicate Path",
  "DUP_RECORDER_PATH_BODY" : "This recorder's group and path overlap with an active recorder.",
  "REG_SUCCESS_TITLE" : "REGISTRATION SUCCESS",
  "REG_SUCCESS_BODY" : "<p><center><span style='color:#008000;font-weight:bold;font-size: 50px;'>&#x2714;</span><br></br><span style='font-weight:bold;font-size: 16px;'>Registration completed successfully</span><br></br><span>Thank you. You can log in for service virtualization now</span></center></p>",
  "CLOSE_PRMRY_BTN_FOOTER" : '<button type="button" data-dismiss="modal" class="btn btn-lg btn-primary">Close</button>', 
  "DATAGEN_ALERT_MSG_1000ROWS" : "You may generate up to 1,000 rows of data at a time. Utilize the row id index for more.",
  "DEL_CONFIRM_TITLE" : "Delete Confirmation",
  "RESTORE_CONFIRM_TITLE" : "Restore Confirmation",
  "DEL_CONFIRM_BODY" : "This service will be deleted and moved to Archive. Do you want to continue ?",
  "DEL_REC_CONFIRM_BODY" : "Do you really want to delete this recording?",
  "DEL_CONFIRM_FOOTER" : '<button type="button" data-dismiss="modal" class="btn btn-warning" id="modal-btn-yes">Yes</button><button type="button" data-dismiss="modal" class="btn btn-default" id="modal-btn-no">No</button>',
  "DEL_CONFIRM_USER_BODY": 'Do you really want to remove this user from the group?',
  "DEL_CONFIRM_RRPAIR_BODY" : 'Do you really want to delete this RRPair ?',
  "BULK_UPLOAD_SUCCESS_MSG" : "Bulk Upload Success! File Uploaded - ",
  "BULK_UPLOAD_FAILURE_MSG" : "Unexpected Error. Bulk Upload Fail. File Uploaded - ",
  "BULK_UPLOAD_FILE_TYPE_FAILURE_MSG" : "Uploaded file type is not zip. File Uploaded - ",
  "SPEC_UPLOAD_SUCCESS_MSG" : "Spec Upload Success! File Uploaded - ",
  "SPEC_UPLOAD_FAILURE_MSG" : "Unexpected Error. Spec Upload Fail. File Uploaded - ",
  "SPEC_FILE_TYPE_URL_PUBLISH_ERROR" : "Your uploaded file type Or URL don't match with Spec type.",
  "SPEC_FILE_TYPE_UPLOAD_ERROR" : "Upload Fail - Your uploaded file type don't match with Spec type. Uploaded File - ",
  "DUPLICATE_CONFIRM_FOOTER" : '<button type="button" data-dismiss="modal" class="btn btn-danger">Back</button>',
  "IMPORT_ERR_MSG" : "You should upload only correct json file.",
  "SUCCESS" : "success",
  "GRP_ALREADY_EXIST_MSG" : "Group Name Already exist.",
  "DEL_Permanent_CONFIRM_BODY" : "This service will be deleted permanently. Do you want to continue ?",
  "RESTORE_CONFIRM_BODY" : "This service will be restored. You can find this service in browse tab. Continue ?",
  "GRP_CREATED_SUCCESS_MSG": "Group Created Successfully",
  "GRP_DELETION_SUCCESS_MSG" : "Group Deleted Successfully",
  "DEL_DRAFTSERVICE_BODY" : "This service Info will be deleted. Do you want to continue ?",
  "PUB_FAIL_SERV_SAVE_BODY" : " Please ensure your request / response pairs are well formed.                   ", /*+
                                "Do you want to save the Service Info as draft",*/
  //"PUB_FAIL_SERV_SAVE_FOOTER" : '<button type="button" data-dismiss="modal" class="btn btn-success" id="modal-btn-yes">Save as Draft</button><button type="button" data-dismiss="modal" class="btn btn-danger" id="modal-btn-no">Back</button>',
  "PUB_FAIL_SERV_SAVE_FOOTER" : '<button type="button" data-dismiss="modal" class="btn btn-danger" id="modal-btn-no">Back</button>',
  "SERV_INFO_NOT_FOUND" : "Service Info not found",
  "SERV_SAVE_FAIL_ERR_TITLE" : "Service Info Failure",
});
