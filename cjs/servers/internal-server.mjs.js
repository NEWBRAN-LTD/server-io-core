'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var Koa = require('koa');
var webserver = require('./webserver.mjs.js');
var serveStatic = require('./serve-static.mjs.js');
var socketIoServer = require('./socket-io-server.mjs.js');
var debuggerServer = require('../middlewares/debugger/debugger-server.mjs.js');
var reload = require('../middlewares/reload/reload.mjs.js');
var index = require('../middlewares/index.mjs.js');
var debug$1 = require('../utils/debug.mjs.js');
require('../utils/open.mjs.js');
require('../utils/common.mjs.js');
require('../utils/config/defaults.mjs.js');
require('@jsonql/utils');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var Koa__default = /*#__PURE__*/_interopDefaultLegacy(Koa);

// the combine startup server now is here
const debug = debug$1.getDebug('createInternalServer');
// main
async function createInternalServer (config) {
  let io = null;
  let socketIsEnabled = false;
  const app = new Koa__default["default"]();
  const namespaceInUsed = [];
  const unwatchFn = [];
  const {
    webserver: webserver$1,
    startInternal,
    stopInternal
  } = webserver.webserverGenerator(app, config);
  // 2018-08-17 unless specify the socket will always be enable
  // 2019-05-01 if we need to proxy out the ws then this socket can not start
  // because we have to hijack it at the higher server.on.upgrade event
  if (
    config.socket.enable ||
    config.reload.enable ||
    (config.debugger.enable && config.debugger.server === true)
  ) {
    socketIsEnabled = true;
    io = socketIoServer.socketIoGenerator(webserver$1, config);
  }
  // @TODO we need to combine the two socket server into one
  // 1. check if those modules that require a socket server is needed
  // 2. generate a socket server, then passing the instance back to
  // their respective constructors
  // Run the watcher, return an unwatch function
  if (config.reload.enable) {
    // Limiting the config options
    unwatchFn.push(reload.reloadGenerator(config.webroot, io, config.reload));
    namespaceInUsed.push(config.reload.namespace);
  }
  // Debugger server start
  if (config.debugger.enable && config.debugger.server === true) {
    unwatchFn.push(debuggerServer.debuggerServer(config, io));
    namespaceInUsed.push(config.debugger.namespace);
  }
  // Enable the injectors here, if socket server is enable that means
  // The injector related function need to be activated
  index.registerMiddlewares(app, config);
  // @TODO should this return a promise so we know if it works or not?
  // Keep the init of the static serve until the last call
  serveStatic.serverStatic(app, config);
  // Call back on close
  webserver$1.on('close', () => {
    debug('webserver on close and clean up');
    // MockServerInstance.close();
    if (io && io.server && io.server.close) {
      io.server.close();
    }
    unwatchFn.forEach(fn => fn());
  });
  // V.2 return a whole bunch of props for use later
  return { webserver: webserver$1, app, startInternal, stopInternal, io, socketIsEnabled }
}

exports.createInternalServer = createInternalServer;
