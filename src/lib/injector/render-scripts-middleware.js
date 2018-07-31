/**
 * This will combine debugger and reload client file overwrite in one place
 * there will be just one middleware to handle them
 */
const fs = require('fs');
const _ = require('lodash');
const chalk = require('chalk');
const { join } = require('path');
// Const gutil = require('gulp-util');
const { logutil, getSocketConnectionConfig } = require('../utils/helper');
// @20171117 integration with stacktrace
const stacktraceName = 'stacktrace.js';
const contentType = 'application/javascript; charset=utf-8';
/**
 * Get scripts paths
 * @param {object} config the main config object
 * @return {object} parse file paths
 */
const getFeatureScripts = config => {
  const socketIoJs = '/socket.io/socket.io.js';
  // Debugger
  const debuggerPath = config.debugger.namespace;
  const eventName = config.debugger.eventName;
  const debuggerJs = [debuggerPath, config.debugger.js].join('/');
  const stacktraceJsFile = [debuggerPath, stacktraceName].join('/');
  // Reload
  const reloadPath = config.reload.namespace;
  const reloadEventName = config.reload.eventName;
  const reloadJs = [reloadPath, config.reload.js].join('/');
  // Return
  return {
    debuggerPath,
    eventName,
    reloadPath,
    reloadEventName,
    socketIoJs,
    debuggerJs,
    stacktraceJsFile,
    reloadJs
  };
};

/**
 * Find the stack track file
 * @return {string} path to stacktrace file
 */
const searchStacktraceSrc = () => {
  const stacktraceFile = join(
    'node_modules',
    'stacktrace-js',
    'dist',
    'stacktrace-with-promises-and-json-polyfills.js'
  );
  return [join(__dirname, '..', '..', '..', stacktraceFile), stacktraceFile]
    .filter(f => {
      return fs.existsSync(f);
    })
    .reduce((first, next) => {
      return next;
    }, null);
};

/**
 * This become a standalone middleware and always going to inject to the app
 * @param {object} config the main config object
 * @return {undefined} nothing
 */
const renderScriptsMiddleware = config => {
  const {
    debuggerPath,
    eventName,
    reloadPath,
    reloadEventName,
    debuggerJs,
    stacktraceJsFile,
    reloadJs
  } = getFeatureScripts(config);
  // Just notify the console
  // logutil(chalk.white('[debugger] ') + chalk.yellow('client is running'));
  // Export middleware
  return async function(ctx, next) {
    await next();
    // Check
    switch (ctx.url) {
      case debuggerJs:
        fs.readFile(join(__dirname, '..', 'debugger', 'client.tpl'), (err, data) => {
          if (err) {
            const msg = 'Error reading io-debugger-client file';
            logutil(chalk.red(msg), chalk.yellow(err));
            ctx.throw(404, msg);
          } else {
            // If they want to ping the server back on init
            const ping =
              typeof config.debugger.client === 'object' && config.debugger.client.ping
                ? 'true'
                : 'false';
            // There is a problem when the server is running from localhost
            // and serving out to the proxy and the two ip address are not related to each other
            // and for most of the cases, the client is always pointing back to itself anyway
            const serveDataFn = _.template(data.toString());
            // Force websocket connection
            // see: http://stackoverflow.com/questions/8970880/cross-domain-connection-in-socket-io
            // @2017-06-29 forcing the connection to socket only because it just serving up local!
            const connectionOptions = getSocketConnectionConfig(config);
            // Using the template method instead
            const serveData = serveDataFn({
              debuggerPath,
              eventName,
              ping,
              connectionOptions,
              consoleDebug: config.debugger.consoleDebug
            });
            // @TODO we should cache this file, otherwise every reload will have to generate it again
            // The question is where do we cache it though ...
            ctx.type = contentType;
            ctx.status = 200;
            ctx.body = serveData;
          }
        });
        break;
      case stacktraceJsFile:
        fs.readFile(searchStacktraceSrc(), { encoding: 'utf8' }, (err, data) => {
          if (err) {
            const msg = 'Error reading stacktrace source file!';
            logutil(chalk.red(msg), chalk.yellow(err));
            ctx.throw(404, msg);
          } else {
            ctx.type = contentType;
            ctx.status = 200;
            ctx.body = `${data}`;
          }
        });
        break;
      case reloadJs:
        fs.readFile(join(__dirname, '..', 'reload', 'reload.tpl'), (err, data) => {
          if (err) {
            const msg = 'Error reading io-reload-client file';
            logutil(chalk.red(msg), chalk.yellow(err));
            ctx.throw(404, msg);
          } else {
            const clientFileFn = _.template(data.toString());
            const connectionOptions = getSocketConnectionConfig(config);
            const serveData = clientFileFn({
              reloadNamespace: reloadPath,
              eventName: reloadEventName,
              connectionOptions
            });
            ctx.type = contentType;
            ctx.status = 200;
            ctx.body = serveData;
          }
        });
        break;
      default:
    }
  };
};

// Export
module.exports = {
  getFeatureScripts,
  renderScriptsMiddleware
};
