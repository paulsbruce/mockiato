// get environment variables
require('dotenv').config();

// boostrap utility functions
require('./lib/util');

// import dependencies
const express = require('express');
const app = express();
const session = require('express-session'); //secure cookies
const compression = require('compression');
const debug = require('debug')('default');
const path = require('path');
const morgan = require('morgan')
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const actuator = require('express-actuator');
const schedule = require('node-schedule');
const Archive  = require('./models/common/Archive');
const System = require('./models/common/System');
const MQService = require('./models/mq/MQService');
const constants = require('./lib/util/constants');
const fuseHelper = require('./lib/util/fuse');
const reportingRouter = require('./routes/report');
global.__basedir = __dirname;

// connect to database
const db = require('./models/db');
db.on('error', function(err)  { throw err; });
db.once('open', function() {
  debug(`Successfully connected to Mongo (${process.env.MONGODB_HOST})`);

  // ready to start
  app.emit('ready');
});
app.on('ready', init);

function init() {
  // register middleware
  app.use(helmet());
  app.use(compression());
  app.use(morgan('dev'));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
  
  // parse request body as plaintext if no content-type is set
  app.use(function(req, res, next) {
    if (!req.get('content-type')) {
      req.headers['content-type'] = 'text/plain';
    }
    return next();
  });

  //secure cookies
  app.use(session({
    cookieName: 'mockiatoSession',
    secret: process.env.MOCKIATO_SECRET,
    resave: false,
    saveUninitialized: true,
    httpOnly: true,  // dont let browser javascript access cookie ever
    secure: true, // only use cookie over https
    ephemeral: true // delete this cookie while browser close
  }));


  // parse request body based on content-type
  app.use(bodyParser.text({ limit: '5mb', type: [ 'application/x-www-form-urlencoded', 'application/soap+xml', 'application/xml', 'text/xml', 'text/plain' ]}));
  app.use(bodyParser.json({ limit: '5mb', type: [ 'application/json' ]}));
  //app.use(bodyParser.urlencoded({ extended: false }));

  // expose health info
  app.use(actuator('/api/admin'));

  const ProtectedRoutes = express.Router();

  app.use('/api-docs', ProtectedRoutes);

  
  var jwt2 = require('express-jwt');
  // expose swagger ui for internal api docs
  const YAML = require('yamljs');
  const apiDocs = YAML.load('./api-docs.yml');
  const swaggerUI = require('swagger-ui-express');
  app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(apiDocs), jwt2({ secret: process.env.MOCKIATO_SECRET }),
    function (req, res) {
      if (!req.user.admin) return res.sendStatus(401);
      res.sendStatus(200);
    });

  // configure auth
  const passport = require('passport');
  const passportOpts = { session: false };
  const authType = process.env.MOCKIATO_AUTH || 'local';

  // setup local authentication
  if (authType === 'local') {
    debug('Using local auth strategy');

    const local = require('./lib/auth/local');
    app.use('/register', local);
  }
  // setup ldap authentication
  else if (authType === 'ldapauth') {
    debug('Using LDAP auth strategy');

    require('./lib/auth/ldap');
  }

  // route to retrieve login token
  const jwt = require('jsonwebtoken');
  const secret = process.env.MOCKIATO_SECRET;
  app.set('secret', secret);
  app.post('/api/login', passport.authenticate(authType, passportOpts),
    function(req, res) {
      const user = {
        uid: req.user.uid,
        mail: req.user.mail
      };

      if (authType === 'ldapauth') {
        // create new user on first login
        user.uid = req.user.sAMAccountName;
        mongoose.model('User').findOne({uid: user.uid}, function(err, foundUser) {
          if (err) {
            debug(err);
            return;
          }
          if (!foundUser) {
            mongoose.model('User').create(user,
              function(err, newUser) {
                if (err) {
                  debug(err);
                  return;
                }
              });
          }
        });
      }

      // create access token
      const token = jwt.sign(user, app.get('secret'), {
        expiresIn: '1d'
      });

      res.json({
        success: true,
        token: token
      });
      
  });

  //When a Ldap user try to register externally. Show message.
  app.get('/register', function (req, res) {
    const htmlView = constants.ORG_USR_REGISTER_VIEW;
    res.set('Content-Type', 'text/html');
    res.send(htmlView);
  });

  // expose API and virtual SOAP / REST services
  const virtual = require('./routes/virtual');
  const api = require('./routes/services');
  const invoke = require('./routes/invoke');
  const restclient = require('./routes/restClient');
  // register SOAP / REST virts from DB
  virtual.registerAllRRPairsForAllServices();

  app.use('/api/services', api);
  app.use('/virtual', virtual.router);
  app.use('/virtual', invoke.router);
  app.use('/restClient', restclient);

  // initialize recording routers
  const recorder = require('./routes/recording');
  const recorderController = require('./controllers/recorderController');
  app.use('/recording',recorder.recordingRouter);
  app.use('/api/recording',recorder.apiRouter);
  app.use('/api/report/',reportingRouter.router);

  const mqController = require('./controllers/mqController');
  mqController.registerAllMQServices();

  // register new virts on all threads
  if (process.env.MOCKIATO_MODE !== 'single') {
    process.on('message', function(message) {

      const msg = message.data;
      if(msg.service){
        const service = msg.service;
        const action  = msg.action;
        debug(action);

        if (service.type !== 'MQ') {
          virtual.deregisterService(service);
          invoke.deregisterServiceInvoke(service);
          if (action === 'register') {
            virtual.registerService(service);
            
            if(service.liveInvocation && service.liveInvocation.enabled){
              invoke.registerServiceInvoke(service);
            }
          }
        }
        else {
          mqController.deregisterMQService(service);
          if (action === 'register') {
            mqController.registerMQService(service);
          }
        }
      }else if(msg.recorder){
        const rec = msg.recorder;
        const action  = msg.action;

        if(action === 'register'){
          recorderController.registerRecorder(rec);
        }else if(action === 'deregister'){
          recorderController.deregisterRecorder(rec);
        }
      }
    });
  }

  // running a cronjob only in master cluster (single instance)
  if (process.env.MOCKIATO_MODE !== 'single' && process.env.NODE_APP_INSTANCE === '0') {
    let priorDate_30days = new Date(new Date().setDate(new Date().getDate() - 30));
    let rule = process.env.MOCKIATO_ARCHIVE;
    schedule.scheduleJob(rule, function(){
      console.log('******cron job run for cleaning Archive collection by only master cluster (single process)****** Node Instance Id :- --'+ process.env.NODE_APP_INSTANCE);
      const query =  { 'createdAt': { $lt: priorDate_30days } };
      Archive.find(query, function(error, services) {
        if (error) debug(error);
        Archive.remove(query, function(error, removed) {
          if (error) debug(error);
        });
        console.log('No. of Documents deleted from Archive:- '+services.length);
      });
    });
  }

  // expose api methods for users and groups
  const systems = require('./routes/systems');
  app.use('/api/systems', systems);

  const users = require('./routes/users');
  app.use('/api/users', users);

  const mqinfo = require('./routes/mqInfo');
  app.use('/api/mqinfo', mqinfo);

  // handle no match responses
  app.use(/\/((?!recording).)*/,function(req, res, next) {
    if (!req.msgContainer) {
      req.msgContainer = {};
      req.msgContainer.reqMatched = false;
      req.msgContainer.reason = `Path ${req.path} could not be found`;
    }

    return res.status(404).json(req.msgContainer);
  });

  // handle internal errors
  app.use(/\/((?!recording).)*/,function(err, req, res) {
    debug(err.message);
    return res.status(500).send(err.message);
  });

  // ready for testing (see test/test.js)
  fuseHelper.fuseAllFiles();
  app.emit('started');
}

module.exports = app;
