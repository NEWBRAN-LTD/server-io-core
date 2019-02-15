/**
 * Top level interfaces (export all the require pacakge to use in other places)
 */
const Koa = require('koa');
const _ = require('lodash');
const chalk = require('chalk');
// Ours
const { webserverGenerator, staticServe, socketServer } = require('./lib/server');
const debuggerServer = require('./lib/debugger');
const { clientReload, serverReload } = require('./lib/reload');
const openInBrowser = require('./lib/utils/open');
// Debug
const debug = require('debug')('server-io-core:main');
const { logutil } = require('./lib/utils/');

const middlewaresHandler = require('./lib/middlewares');

/**
 * @param {object} config options
 * @return {object} http server instance
 * @api public
 */
exports.serverIoCore = function(config) {
  const app = new Koa();
  let io = null;
  let unwatchFn = [];
  // Init web server
  const { webserver, start, stop } = webserverGenerator(app, config);
  // Setup the callback
  const cb = config.callback;
  config.callback = () => {
    // For some reason the config is undefined and nothing can pass to it
    if (typeof cb === 'function') {
      Reflect.apply(cb, null, [config]);
    }

    const displayHost = _.isArray(config.host) ? config.host[1] : config.host;
    // Notify
    logutil(
      chalk.white(`server-io-core (${config.version}) running at`),
      chalk.yellow(
        [
          'http',
          config.https.enable ? 's' : '',
          '://',
          displayHost,
          ':',
          config.port
        ].join('')
      )
    );
    openInBrowser(config);
  };

  // 2018-08-17 unless specify the socket will always be enable
  if (
    config.socket.enable ||
    config.reload.enable ||
    (config.debugger.enable && config.debugger.server === true)
  ) {
    io = socketServer(webserver, config);
  }
  // @TODO we need to combine the two socket server into one
  // 1. check if those modules that require a socket server is needed
  // 2. generate a socket server, then passing the instance back to
  // their respective constructors
  // Run the watcher, return an unwatch function

  if (config.reload.enable) {
    // Limiting the config options
    unwatchFn.push(clientReload(config.webroot, io, config.reload));
  }

  // Debugger server start
  if (config.debugger.enable && config.debugger.server === true) {
    unwatchFn.push(debuggerServer(config, io));
  }

  // Add watching server side file
  if (config.serverReload.enable) {
    unwatchFn.push(serverReload(config.serverReload));
  }

  // Enable the injectors here, if socket server is enable that means
  // The injector related function need to be activated
  const { unwatchMockFn } = middlewaresHandler(app, config);
  // Keep the init of the static serve until the last call
  staticServe(config)(app);
  // Start server @2018-08-13
  if (config.autoStart === true) {
    start();
  }

  // Call back on close
  webserver.on('close', () => {
    debug('server on close');
    unwatchMockFn();
    // MockServerInstance.close();
    if (io && io.server && io.server.close) {
      io.server.close();
    }

    unwatchFn.forEach(fn => fn());
  });
  // Finally return the instance
  return { webserver, app, start, stop, io };
};
