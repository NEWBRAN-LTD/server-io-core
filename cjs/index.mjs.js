'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var internalServer = require('./servers/internal-server.mjs.js');
var publicProxyServer = require('./servers/public-proxy-server.mjs.js');
var open = require('./utils/open.mjs.js');
var constants = require('./lib/constants.mjs.js');
var debug$1 = require('./utils/debug.mjs.js');
var startMsg = require('./utils/start-msg.mjs.js');
require('./utils/common.mjs.js');
require('./utils/config/defaults.mjs.js');
require('@jsonql/utils');

// V.2 using ESM
const debug = debug$1.getDebug('main');
// Main
async function serverIoCore (config = {}) {
  // v2.3.0 we need to retain the old port number and pass here again
  let overwritePort = null;
  // first start our internal
  const {
    webserver,
    app,
    io,
    startInternal,
    stopInternal,
    socketIsEnabled
  } = await internalServer.createInternalServer(config);
  // first just store the stop call in here
  const allStop = [stopInternal];
  const configCb = config.callback;
  // here we combine several start callstopInternal togethear
  const startAllFn = async () => {
    const port0 = await startInternal();
    debug(`Internal server started on ${port0}`);
    config[constants.INTERNAL_PORT] = port0;
    config.socketIsEnabled = socketIsEnabled;
    if (config[constants.MASTER_MIND].enable === true && overwritePort !== null) {
      config.port = overwritePort;
    }
    const {
      startPublic,
      stopPublic
    } = await publicProxyServer.createPublicProxyServer(config);
    allStop.push(stopPublic);
    // this callback is from config
    if (typeof configCb === 'function') {
      Reflect.apply(configCb, null, [config]);
    }
    const { port, address } = await startPublic();
    if (config[constants.MASTER_MIND].enable === true) {
      overwritePort = port;
    }
    debug('Public proxy server started on ', address, port);
    config.port = port; // swap the port number because it could be a dynamic port now
    open.openInBrowser(config);
    startMsg.startMsg(config);
    // create a table display
    return [port, port0, address]
  };
  // stop all
  const stopAllFn = () => {
    allStop.forEach((stop, i) => {
      debug('stop server', i);
      stop();
    });
  };
  // now we deal with the autoStart here
  if (config[constants.AUTO_START] === true) {
    await startAllFn();
  }
  // return all the references
  return {
    config, // 2.3.0 return the config for master mind
    webserver,
    app,
    io,
    start: startAllFn,
    stop: stopAllFn
  }
}

exports.serverIoCore = serverIoCore;
