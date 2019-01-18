const Service = require('../models/http/Service');
const MQService = require('../models/mq/MQService');
const RRPair  = require('../models/http/RRPair');
const Archive  = require('../models/common/Archive');
const virtual = require('../routes/virtual');
const manager = require('../lib/pm2/manager');
const debug = require('debug')('default');
const oas = require('../lib/openapi/parser');
const wsdl = require('../lib/wsdl/parser');
const rrpair = require('../lib/rrpair/parser');
const request = require('request');
const fs   = require('fs');
const unzip = require('unzip2');
const YAML = require('yamljs');
const invoke = require('../routes/invoke'); 

/**
 * Helper function for search. Trims down an HTTP service for return, and filters + trims rrpairs. 
 * @param {*} doc Service doc from mongoose
 * @param {*} searchOnReq text to filter Request on
 * @param {*} searchOnRsp text to filter Response on
 */
function trimServiceAndFilterRRPairs(doc,searchOnReq,searchOnRsp){
  //Trim service
  var service = {
    id : doc.id,
    name : doc.name,
    sut : {name : doc.sut.name, _id : doc.sut._id},
    type : doc.type,
    user : {uid : doc.user.uid, _id : doc.user._id},
    basePath : doc.basePath
  };

  //If we have RRpairs to filter...
  if(doc.rrpairs){
    service.rrpairs = [];
    doc.rrpairs.forEach(function(rrpair){
      var addThisRRPair = true;

      //If req/rsp don't contain search string, fail this one
      if(searchOnReq && rrpair.reqDataString){
        addThisRRPair = rrpair.reqDataString.toLowerCase().includes(searchOnReq.toLowerCase());
      }
      if(searchOnRsp && addThisRRPair && rrpair.resDataString){
        addThisRRPair = rrpair.resDataString.toLowerCase().includes(searchOnRsp.toLowerCase());;
      }

      //If req/rsp search is enabled and it has no req/rsp, fail it
      if(searchOnReq && !(rrpair.reqDataString)){
        addThisRRPair = false;
      }
      if(searchOnRsp && !(rrpair.resDataString)){
        addThisRRPair = false;
      }

      //If we're still supposed to add this..
      if(addThisRRPair){
        
        //Pull object names from RRPair's schema. Trim out reqDataString and rspDataString and copy the rest.
        var trimmedRRPair = {};
        for(var key in RRPair.schema.obj){
          if(key != 'resDataString' && key != 'reqDataString'){
            trimmedRRPair[key] = rrpair[key];
          }
        }
        trimmedRRPair._id = rrpair._id;
        service.rrpairs.push(trimmedRRPair);
      }

    });

  }
  return service;
}


/**
 * Handles API call for search services
 * path param: ID of a service to limit this search to this param
 * queries-
 * requestContains: Filters only services that have rr pairs that contain this string in their request. Only returns rrpairs that match this as well.
 * responseContains: Filters only services that have rr pairs that contain this string in their response. Only returns rrpairs that match this as well.
 * @param {*} req 
 * @param {*} rsp 
 */
function searchServices(req,rsp){

  //Build search query
  var search = {};
  if(req.params.id){
    search._id = req.params.id;
   }
   var query = req.query;
   var searchOnReq = false;
   var searchOnRsp = false;
   if(query.requestContains){
     searchOnReq = query.requestContains;
     search['rrpairs.reqDataString'] = {$regex:searchOnReq,$options:'i'};
   }
   if(query.responseContains){
    searchOnRsp = query.responseContains;
    search['rrpairs.resDataString'] = {$regex:searchOnRsp,$options:'i'};
  }

  //Perform search
   Service.find(search,function(err,docs){
      var results = [];

      if(err){
        handleError(rsp,err,500);
      }

      //Trim down service and add it to list of services to return
      docs.forEach(function(doc){
        var service = trimServiceAndFilterRRPairs(doc,searchOnReq,searchOnRsp);
        results.push(service);
      });
      
      return rsp.json(results);
   });
}



function getServiceById(req, res) {
  // call find by id function for db
  Service.findById(req.params.id, function (err, service) {
    if (err) {
      handleError(err, res, 500);
      return;
    }

      if (service) {
        return res.json(service);
      }
      else {
        MQService.findById(req.params.id, function(error, mqService) {
          if (error)	{
            handleError(error, res, 500);
            return;
          }

          return res.json(mqService);
        });
      }
  });
}

function getArchiveServiceInfo(req, res) {
  // call find by id of service or mqservice function for db
  const query = { $or: [ { 'service._id': req.params.id }, { 'mqservice._id': req.params.id } ] };
  Archive.find(query, function (err, services) {
    if (err) {
      handleError(err, res, 500);
      return;
    }

      if (services) {
        return res.json(services[0]);
      }
  });
}

function getServicesByUser(req, res) {
  let allServices = [];

  const query = { 'user.uid': req.params.uid };

  Service.find(query, function(err, services) {
    if (err) {
      handleError(err, res, 500);
      return;
    }

    allServices = services;

    MQService.find(query, function(error, mqServices) {
      if (error)	{
        handleError(error, res, 500);
        return;
      }

      if (mqServices.length) {
        allServices = allServices.concat(mqServices);
      }

      return res.json(allServices);
    });
  });
}

function getArchiveServicesByUser(req, res) {
  let allServices = [];
  const query = { $or: [ { 'service.user.uid': req.params.uid }, { 'mqservice.user.uid': req.params.uid } ] };
  Archive.find(query, function(err, services) {
    if (err) {
      handleError(err, res, 500);
      return;
    }
    allServices = services;
    return res.json(allServices);
  });
}

function getServicesBySystem(req, res) {
  let allServices = [];

  const query = { 'sut.name': req.params.name };

  Service.find(query, function(err, services) {
    if (err) {
      handleError(err, res, 500);
      return;
    }

    allServices = services;

    MQService.find(query, function(error, mqServices) {
      if (error)	{
        handleError(error, res, 500);
        return;
      }

      if (mqServices.length) {
        allServices = allServices.concat(mqServices);
      }

      return res.json(allServices);
    });
  });
}

function getServicesArchiveBySystem(req, res) {
  let allServices = [];

  const query = { $or: [ { 'service.sut.name': req.params.name }, { 'mqservice.sut.name': req.params.name } ] };

  Archive.find(query, function(err, services) {
    if (err) {
      handleError(err, res, 500);
      return;
    }

    allServices = services;
    return res.json(allServices);
  });
}

function getServicesByQuery(req, res) {
  const query = {};

  const sut  = req.query.sut;
  const user = req.query.user;

  if (sut) query['sut.name']  = sut;
  if (user) query['user.uid'] = user;

  // call find function with queries
  let allServices = [];
  Service.find(query, function(err, services)	{
      if (err)	{
        handleError(err, res, 500);
        return;
      }

      allServices = services;

      MQService.find(query, function(error, mqServices) {
        if (error)	{
          handleError(error, res, 500);
          return;
        }
  
        if (mqServices.length) {
          allServices = allServices.concat(mqServices);
        }

        return res.json(allServices);
      });
  });
}

function getArchiveServices(req, res) {
  const sut  = req.query.sut;
  const user = req.query.user;

  const query = { $or: [ { 'service.sut.name': sut }, { 'mqservice.sut.name': sut },{ 'service.user.uid': user }, 
            { 'mqservice.user.uid': user } ] };

  Archive.find(query, function(err, services)	{
      if (err)	{
        handleError(err, res, 500);
        return;
      }
      return res.json(services);
  });
}

// function to check for duplicate service & twoSeviceDiffNameSameBasePath
function searchDuplicate(service, next) {
  const query2ServDiffNmSmBP = {
    name: { $ne: service.name },
    basePath: service.basePath
  };

  const query = {
    name: service.name,
    basePath: service.basePath
  };

  Service.findOne(query2ServDiffNmSmBP, function (err, sameNmDupBP) {
    if (err) {
      handleError(err, res, 500);
      return;
    }
    else if (sameNmDupBP)
      next({ twoServDiffNmSmBP: true });
    else {
      Service.findOne(query, function (err, duplicate) {
        if (err) {
          handleError(err, res, 500);
          return;
        }
        next(duplicate);
      });
    }
  });
}

// returns a stripped-down version on the rrpair for logical comparison
function stripRRPair(rrpair) {
  return {
    verb: rrpair.verb || '',
    path: rrpair.path || '',
    payloadType: rrpair.payloadType || '',
    queries: rrpair.queries || {},
    reqHeaders: rrpair.reqHeaders || {},
    reqData: rrpair.reqData || {},
    resStatus: rrpair.resStatus || 200,
    resHeaders: rrpair.resHeaders || {},
    resData: rrpair.resData || {}
  };
}

// function to merge req / res pairs of duplicate services
function mergeRRPairs(original, second) {
  for (let rrpair2 of second.rrpairs) {
    let hasAlready = false;
    let rr2 = stripRRPair(new RRPair(rrpair2));

    for (let rrpair1 of original.rrpairs) {
      let rr1 = stripRRPair(rrpair1);

      if (deepEquals(rr1, rr2)) {
        hasAlready = true;
        break;
      }
    }

    // only add RR pairs that original doesn't have already
    if (!hasAlready) {
      original.rrpairs.push(rrpair2);
    }
  }
}

// propagate changes to all threads
function syncWorkers(service, action) {
  const msg = {
    action: action,
    service: service
  };

  manager.messageAll(msg)
    .then(function(workerIds) {
      virtual.deregisterService(service);
      invoke.deregisterServiceInvoke(service);

      if (action === 'register') {
        virtual.registerService(service);
        if(service.liveInvocation && service.liveInvocation.enabled){
          invoke.registerServiceInvoke(service);
        }
      }
      else {
        Service.findOneAndRemove({_id : service._id }, function(err)	{
          if (err) debug(err);
          //debug(service);
        });
      }
    })
    .catch(function (err) {
      debug(err);
    });
}

function addService(req, res) {
  const type = req.body.type;

  let serv  = {
    sut: req.body.sut,
    user: req.decoded,
    name: req.body.name,
    type: req.body.type,
    delay: req.body.delay,
    delayMax: req.body.delayMax,
    basePath: '/' + req.body.sut.name + req.body.basePath,
    matchTemplates: req.body.matchTemplates,
    rrpairs: req.body.rrpairs,
    lastUpdateUser: req.decoded
  };

  //Save req and res data string cache
  if(serv.rrpairs){
    serv.rrpairs.forEach(function(rrpair){
      if(rrpair.reqData)
        rrpair.reqDataString = typeof rrpair.reqData == "string" ? rrpair.reqData : JSON.stringify(rrpair.reqData);
      if(rrpair.resData)
        rrpair.resDataString = typeof rrpair.resData == "string" ? rrpair.resData : JSON.stringify(rrpair.resData);
    });
  }

  if(req.body.liveInvocation){
    serv.liveInvocation = req.body.liveInvocation;
  }

  if (type === 'MQ') {
    serv.connInfo = req.body.connInfo;
    
    MQService.create(serv,
      // handler for db call
      function(err, service) {
        if (err) {
          handleError(err, res, 500);
          return;
        }
        // respond with the newly created resource
        res.json(service);
    });
  }
  else {
    serv.delay = req.body.delay;
    serv.basePath =  '/' + req.body.sut.name + req.body.basePath;

    searchDuplicate(serv, function(duplicate) {
      if (duplicate && duplicate.twoServDiffNmSmBP){
        res.json({"error":"twoSeviceDiffNameSameBasePath"});
        return;
      }
      else if (duplicate) { 
        // merge services
        mergeRRPairs(duplicate, serv);
        // save merged service
        duplicate.save(function(err, newService) {
          if (err) {
            handleError(err, res, 500);
            return;
          }
          res.json(newService);
          
          syncWorkers(newService, 'register');
        });
      }
      else {
        Service.create(serv,
        function(err, service) {
          if (err) {
            handleError(err, res, 500);
            return;
          }
          res.json(service);
  
          syncWorkers(service, 'register');
        });
      }
    });
  }
}

function updateService(req, res) {
  const type = req.body.type;
  const BaseService = (type === 'MQ') ? MQService : Service;

  // find service by ID and update
  BaseService.findById(req.params.id, function (err, service) {
    if (err) {
      handleError(err, res, 400);
      return;
    }

    // don't let consumer alter name, base path, etc.
    service.rrpairs = req.body.rrpairs;
    service.lastUpdateUser = req.decoded;

    //Cache string of reqData + rspData
    if(service.rrpairs){
      service.rrpairs.forEach(function(rrpair){
        if(rrpair.reqData)
          rrpair.reqDataString = typeof rrpair.reqData == "string" ? rrpair.reqData : JSON.stringify(rrpair.reqData);
        if(rrpair.resData)
          rrpair.resDataString = typeof rrpair.resData == "string" ? rrpair.resData : JSON.stringify(rrpair.resData);
      });
    }
    if(req.body.liveInvocation){
      service.liveInvocation = req.body.liveInvocation;
    }
    if (req.body.matchTemplates) {
      service.matchTemplates = req.body.matchTemplates;
    }
    
    if (service.type !== 'MQ') {
      const delay = req.body.delay;
      if (delay || delay === 0) {
        service.delay = req.body.delay;
      }

      const delayMax = req.body.delayMax;
      if (delayMax || delayMax === 0) {
        service.delayMax = req.body.delayMax;
      }
    }

    // save updated service in DB
    service.save(function (err, newService) {
      if (err) {
        handleError(err, res, 500);
        return;
      }

      res.json(newService);
      if (service.type !== 'MQ') {
        syncWorkers(newService, 'register');
      }
    });
  });
}

function toggleService(req, res) {
  Service.findById(req.params.id, function (err, service) {
    if (err) {
      handleError(err, res, 500);
      return;
    }

    if (service) {
      // flip the bit & save in DB
      service.running = !service.running;
      service.lastUpdateUser = req.decoded;
      service.save(function(e, newService) {
        if (e)	{
          handleError(e, res, 500);
          return;
        }

        res.json({'message': 'toggled', 'service': newService });
        syncWorkers(newService, 'register');
      });
    }
    else {
      MQService.findById(req.params.id, function(error, mqService) {
        if (error)	{
          handleError(error, res, 500);
          return;
        }

        mqService.running = !mqService.running;
        mqService.save(function(e2, mqService) {
          if (e2)	{
            handleError(e2, res, 500);
            return;
          }

          res.json({'message': 'toggled', 'service': mqService });
        });
      });
    }
  });
}

function deleteService(req, res) {
  Service.findById(req.params.id, function(err, service)	{
    if (err)	{
      handleError(err, res, 500);
      return;
    }
    
    if (service) {
      service.txnCount=0;
      service.running=false;
      let archive  = {service:service};
      Archive.create(archive, function (err, callback) {
        if (err) {
          handleError(err, res, 500);
        }
      });

      service.remove(function(e, oldService) {
        if (e)	{
          handleError(e, res, 500);
          return;
        }

        res.json({ 'message' : 'deleted', 'id' : oldService._id });
        syncWorkers(oldService, 'delete');
      });
    }
    else {
      MQService.findOneAndRemove({ _id: req.params.id }, function(error, mqService) {
        if (error) debug(error);
        mqService.running=false;
        let archive  = {mqservice:mqService};
        Archive.create(archive, function (err, callback) {
          if (err) {
            handleError(err, res, 500);
          }
        });
        res.json({ 'message' : 'deleted', 'id' : mqService._id });
      });
    }
  });
}

function restoreService(req, res) {
  const query = { $or: [ { 'service._id': req.params.id }, { 'mqservice._id': req.params.id } ] };
  Archive.findOneAndRemove(query, function(err, archive)	{
    if (err)	{
      handleError(err, res, 500);
      return;
    }
    if (archive.service) {
      let newService  = {
        sut: archive.service.sut,
        user: archive.service.user,
        name: archive.service.name,
        type: archive.service.type,
        delay: archive.service.delay,
        delayMax: archive.service.delayMax,
        basePath: archive.service.basePath,
        txnCount: 0,
        running: false,
        matchTemplates: archive.service.matchTemplates,
        rrpairs: archive.service.rrpairs,
        lastUpdateUser: archive.service.lastUpdateUser
      };
      Service.create(newService, function (err, callback) {
        if (err) {
          handleError(err, res, 500);
        }
      });
      res.json({ 'message' : 'restored', 'id' : archive.service._id });
    }
    else {
        let newMQService  = {
          sut: archive.mqservice.sut,
          user: archive.mqservice.user,
          name: archive.mqservice.name,
          type: archive.mqservice.type,
          running: false,
          matchTemplates: archive.mqservice.matchTemplates,
          rrpairs: archive.mqservice.rrpairs,
          connInfo: archive.mqservice.connInfo
        };
        MQService.create(newMQService, function (err, callback) {
          if (err) {
            handleError(err, res, 500);
          }
        });
        res.json({ 'message' : 'restored', 'id' : archive.mqservice._id });
    }
  });
}


// get spec from url or local filesystem path
function getSpecString(path) {
  return new Promise(function (resolve, reject) {
    if (path.includes('http')) {
      request(path, function (err, resp, data) {
        if (err) return reject(err);
        return resolve(data);
      });
    }
    else {
      fs.readFile(path, 'utf8', function (err, data) {
        if (err) return reject(err);
        return resolve(data);
      });
    }
  });

}

function isYaml(req) {
  const url = req.query.url;
  if (url) {
    if (url.endsWith('.yml') || url.endsWith('.yaml'))
      return true;
  }
  if (req.query.uploaded_file_name!="") {
    const name = req.query.uploaded_file_name;
    if (name.endsWith('.yml') || name.endsWith('.yaml')) {
      return true;
    }
  }
  return false;
}

function zipUploadAndExtract(req, res) {
  let extractZip = function () {
    return new Promise(function (resolve, reject) {
      fs.createReadStream(req.file.path).pipe(unzip.Extract({ path: './uploads/RRPair/' + req.decoded.uid + '_' + req.file.filename + '_' + req.file.originalname }));
      resolve('_' + req.file.filename + '_' + req.file.originalname);
    });
  }
  extractZip().then(function (message) {
    res.json(message);
  }).catch(function (err) {
    debug(err);
    handleError(err, res, 400);
  });
}

function specUpload(req, res) {
  let uploadSpec = function () {
    return new Promise(function (resolve, reject) {
      resolve(req.file.filename);
    });
  }
  uploadSpec().then(function (message) {
  res.json(message);
  }).catch(function (err) {
    debug(err);
    handleError(err, res, 400);
  });
}

function publishExtractedRRPairs(req, res) {
  const type = req.query.type;
  const base = req.query.url;
  const name = req.query.name;
  const sut = { name: req.query.group };
  rrpair.parse('./uploads/RRPair/' + req.decoded.uid + req.query.uploaded_file_name_id, type).then(onSuccess).catch(onError);

  function onSuccess(serv) {
    serv.sut = sut;
    serv.name = name;
    serv.type = type;
    serv.basePath = '/' + serv.sut.name +'/'+ base;
    serv.user = req.decoded;

    if (type === 'MQ') {      
      MQService.create(serv,
        // handler for db call
        function(err, service) {
          if (err) {
            handleError(err, res, 500);
            return;
          }
          // respond with the newly created resource
          res.json(service);
      });
    }
    else {
      searchDuplicate(serv, function(duplicate) {
        if (duplicate && duplicate.twoServDiffNmSmBP){
          res.json({"error":"twoSeviceDiffNameSameBasePath"});
          return;
        }
        else if (duplicate) { 
          // merge services
          mergeRRPairs(duplicate, serv);
          // save merged service
          duplicate.save(function(err, newService) {
            if (err) {
              handleError(err, res, 500);
              return;
            }
            res.json(newService);
            
            syncWorkers(newService, 'register');
          });
        }
        else {
          Service.create(serv, function (err, service) {
            if (err) {
              handleError(err, res, 500);
            }
            res.json(service);
            syncWorkers(service , 'register');
          });
        }
      });
    }
  }
  function onError(err) {
    debug(err);
    handleError(err.message, res, 400);
  }
}


function publishUploadedSpec(req, res) {
  const type = req.query.type;
  const name = req.query.name;
  const url = req.query.url;
  const sut = { name: req.query.group };
  const filePath = './uploads/'+req.query.uploaded_file_id;
  const specPath = url || filePath;

  switch (type) {
    case 'wsdl':
      createFromWSDL(specPath).then(onSuccess).catch(onError);
      break;
    case 'openapi':
      const specPromise = getSpecString(specPath);
      specPromise.then(function (specStr) {
        let spec;
        try {
          if (isYaml(req)) {
            spec = YAML.parse(specStr);
          }
          else {
            spec = JSON.parse(specStr);
          }
        }
        catch (e) {
          debug(e);
          return handleError('Error parsing OpenAPI spec', res, 400);
        }

        createFromOpenAPI(spec).then(onSuccess).catch(onError);

      }).catch(onError);
      break;
    default:
      return handleError(`API specification type ${type} is not supported`, res, 400);
  }

  function onSuccess(serv) {
    // set group, basePath, and owner
    serv.sut = sut;
    serv.name = name;
    serv.basePath = '/' + serv.sut.name + serv.basePath;
    serv.user = req.decoded;
    serv.lastUpdateUser = req.decoded;

    searchDuplicate(serv, function(duplicate) {
      if (duplicate && duplicate.twoServDiffNmSmBP){
        res.json({"error":"twoSeviceDiffNameSameBasePath"});
        return;
      }
      else if (duplicate) { 
        // merge services
        mergeRRPairs(duplicate, serv);
        // save merged service
        duplicate.save(function(err, newService) {
          if (err) {
            handleError(err, res, 500);
            return;
          }
          res.json(newService);
          
          syncWorkers(newService, 'register');
        });
      }
      else {
        Service.create(serv, function (err, service) {
          if (err) handleError(err, res, 500);
    
          res.json(service);
          syncWorkers(service, 'register');
        });
      }
    });

    // save the service
   
  }

  function onError(err) {
    debug(err);
    handleError(err, res, 400);
  }
}

function createFromWSDL(file) {
  return wsdl.parse(file);
}

function createFromOpenAPI(spec) {
  return oas.parse(spec);
}

//Permanenet delete from Archieve. Not required right now.
function permanentDeleteService(req, res) {
  // call find by id of service or mqservice function for db
  const query = { $or: [ { 'service._id': req.params.id }, { 'mqservice._id': req.params.id } ] };
  Archive.findOneAndRemove(query, function (err, archive) {
    if (err) {
      handleError(err, res, 500);
      return;
    }
    if(archive.service) res.json({ 'message' : 'deleted', 'id' : archive.service._id });
    else if(archive.mqservice) res.json({ 'message' : 'deleted', 'id' : archive.mqservice._id });
  });
}

module.exports = {
  getServiceById: getServiceById,
  getArchiveServiceInfo: getArchiveServiceInfo,
  getServicesByUser: getServicesByUser,
  getServicesBySystem: getServicesBySystem,
  getServicesByQuery: getServicesByQuery,
  getArchiveServices: getArchiveServices,
  getServicesArchiveBySystem: getServicesArchiveBySystem,
  getArchiveServicesByUser: getArchiveServicesByUser,
  addService: addService,
  updateService: updateService,
  toggleService: toggleService,
  deleteService: deleteService,
  zipUploadAndExtract: zipUploadAndExtract,
  publishExtractedRRPairs: publishExtractedRRPairs,
  specUpload: specUpload,
  publishUploadedSpec: publishUploadedSpec,
  permanentDeleteService: permanentDeleteService,
  restoreService: restoreService,
  searchServices:searchServices
};


//Add resDataString and rspDataString to every existing service on boot, if they do not already have it
Service.find({'rrpairs.resDataString':{$exists:false},'rrpairs.reqDataString':{$exists:false}},function(err,docs){
  if(err){
    console.log(err);
  }else{
    if(docs){
      docs.forEach(function(doc){
        if(doc.rrpairs){
          doc.rrpairs.forEach(function(rrpair){
            if(rrpair.reqData)
              rrpair.reqDataString = typeof rrpair.reqData == 'string' ? rrpair.reqData : JSON.stringify(rrpair.reqData);
            if(rrpair.resData)
              rrpair.resDataString = typeof rrpair.resData == 'string' ? rrpair.resData : JSON.stringify(rrpair.resData);
          });
        }
        doc.save();
      });
    }
  }
});