"use strict";

//Default options
var options = {
    db_url : "mongodb://localhost:27017/test"
  , http_url : "http://localhost:8080/"
  , http_port : 8080
  , login_page : 'index.html'
  , lobby_page : 'index.html'
  , session_timeout: 5 * 60 * 1000
  , debug: true
};

//Override any options from commandline
var argv = require('optimist').argv;
for(var arg in argv) {
  if(arg in options) {
    options[arg] = argv[arg];
  }
}

//Initialize server
var path = require('path')
  , express = require('express')
  , server = express();
  
server.use(express.static(path.join(__dirname, 'www')));
server.use(express.static(path.join(__dirname, 'common')));
server.use(express.bodyParser());
server.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

//Add browserify imports
var browserify = require('browserify')(
  (options.debug ? {
      watch: true
    , cache: false
    , exports: ['require']
  } : {
      cache:true
    , exports: ['require']
  }));
browserify.addEntry('./common/entry.js');
if(!options.debug) {
  //TODO: Add uglify JS here
}

server.use(browserify);


//Initialize application and various subsystems
var async = require('async')
  , mongo = require('mongoskin')
  , EventEmitter = require('events').EventEmitter
  , app = new EventEmitter();

//Save options and server in application
app.server = server;
app.http_server = require('http').createServer(server);
app.options = options;
app.db = mongo.db(options.db_url);
app.browserify = browserify;


//Initialize subsystems
console.log("Initializing server...");
async.series([
  function(cb) {
    require('./server/logger.js').createLoggingService(app, cb);
  }, function(cb) {
    require('./server/authenticate.js').createAuthenticationService(app, cb); 
  }, function(cb) {
    require('./server/accounts.js').createAccountService(app, cb);
  }, function(cb) {
    require('./server/sockets.js').createSocketService(app, cb);
  }, function(cb) {
    require('./server/lobby.js').createLobbyService(app, cb);
  }, function(cb) {
    require('./server/creature.js').createCreatureService(app, cb);
  }
], function(err, result) {

  //Generate bundle immediately
  browserify.bundle();

  app.http_server.listen(options.http_port);

  if(err) {
    console.log("Error Initializing Server:", err);
    process.exit(-1);
  } else {
    process.on('uncaughtException', function(err) {
      console.log("Uncaught error:", err.stack);
    });
    console.log("Server initialized");
  }
});

