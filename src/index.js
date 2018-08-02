/**
 * Top level interfaces (export all the require pacakge to use in other places)
 */
const Koa = require('koa');
const chalk = require('chalk');
// Ours
const { webserverGenerator, staticServe, socketServer } = require('./lib/server');
const { scriptsInjectorMiddleware, renderScriptsMiddleware } = require('./lib/injector');
// Const { createConfiguration } = require('./lib/options');
const debuggerServer = require('./lib/debugger');
const reloadServer = require('./lib/reload');
const openInBrowser = require('./lib/utils/open');
// Debug
const debug = require('debug')('server-io-core:main');
const { logutil } = require('./lib/utils/helper');

/**
 * @param {object} config options
 * @return {object} http server instance
 * @api public
 */
exports.serverIoCore = function(config) {
  const app = new Koa();
  let io = null;
  let unwatchFn = [];
  let mockServerInstance = null;
  // Init web server
  const { webserver, start, stop } = webserverGenerator(app, config);
  // Setup the callback
  const cb = config.callback;
  config.callback = () => {
    // For some reason the config is undefined and nothing can pass to it
    if (typeof cb === 'function') {
      Reflect.apply(cb, null, [config]);
    }
    // Notify
    logutil(
      chalk.white(`gulp-server-io (${config.version}) running at`),
      chalk.cyan(
        ['http', config.https ? 's' : '', '://', config.host, ':', config.port].join('')
      )
    );
    openInBrowser(config);
  };

  if (
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
    unwatchFn.push(reloadServer(config.webroot, io, config.reload));
  }
  // Debugger server start
  if (config.debugger.enable && config.debugger.server === true) {
    unwatchFn.push(debuggerServer(config, io));
  }
  // @TODO add watching server side files
  // New @1.4.0-beta.11 watch a different path and pass a callback
  /*
  if (config.serverReload.enable) {
    unwatchFn.push(serverReload(config.serverReload));
  }
  */
  // Enable the injectors here, if socket server is enable that means
  // The injector related function need to be activated
  if (io) {
    app.use(renderScriptsMiddleware(config));
    app.use(scriptsInjectorMiddleware(config));
  }

  // Keep the init of the static serve until the last call
  staticServe(config)(app);
  // Start server
  start();
  // Detect ctrl-c
  process.on('kill', () => {
    debug('kill command');
    stop();
  });

  // Call back on close
  webserver.on('close', () => {
    if (mockServerInstance) {
      mockServerInstance.close();
    }
    if (io && io.server && io.server.close) {
      io.server.close();
    }
    unwatchFn.forEach(fn => fn());
  });
  // Finally return the instance
  return webserver;
};
