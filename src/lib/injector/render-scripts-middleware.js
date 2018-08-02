/**
 * This will combine debugger and reload client file overwrite in one place
 * there will be just one middleware to handle them
 */
const fs = require('fs');
const _ = require('lodash');
const chalk = require('chalk');
const { join } = require('path');
// Const gutil = require('gulp-util');
const {
  logutil,
  getSocketConnectionConfig,
  readDocument,
  getDocLen
} = require('../utils/helper');
// @20171117 integration with stacktrace
const { stacktraceName, contentType, dummyJs } = require('../utils/constants');
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
 * Success output
 * @param {object} ctx koa app
 * @param {string} doc rendered html
 * @return {undefined} nothing
 */
const success = (ctx, doc) => {
  ctx.status = 200;
  ctx.type = contentType;
  ctx.status = 200;
  ctx.length = getDocLen(doc);
  ctx.body = doc;
};

/**
 * Group all the fail call
 * @param {object} ctx koa app
 * @param {object} e Error
 * @param {string} msg to throw
 * @return {undefined} nothing
 */
const failed = (ctx, e, msg) => {
  logutil(chalk.red(msg), chalk.yellow(e));
  ctx.throw(404, msg);
};

/**
 * @TODO caching the document
 * @param {string} doc html
 * @return {string} html document
 */
const getCacheVer = doc => {
  return doc;
};

/**
 * Like what the name said
 * @return {string} dummy js content
 */
const dummyOutput = () => Promise.resolve(`console.info('SERVER_IO_CORE', true);`);

/**
 * This become a standalone middleware and always going to inject to the app
 * @param {object} config the main config object
 * @return {undefined} nothing
 * @api public
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
    // Only catch certain methods
    if (ctx.method !== 'HEAD' || ctx.method !== 'GET') {
      await next();
      return;
    }
    // Now check
    switch (ctx.url) {
      case debuggerJs:
        try {
          const body = await readDocument(
            join(__dirname, '..', 'debugger', 'client.tpl')
          ).then(data => {
            // If they want to ping the server back on init
            const ping =
              typeof config.debugger.client === 'object' && config.debugger.client.ping
                ? 'true'
                : 'false';
            // There is a problem when the server is running from localhost
            // and serving out to the proxy and the two ip address are not related to each other
            // and for most of the cases, the client is always pointing back to itself anyway
            const serveDataFn = _.template(data);
            // Force websocket connection
            // see: http://stackoverflow.com/questions/8970880/cross-domain-connection-in-socket-io
            // @2017-06-29 forcing the connection to socket only because it just serving up local!
            const connectionOptions = getSocketConnectionConfig(config);
            // Using the template method instead
            return getCacheVer(
              serveDataFn({
                debuggerPath,
                eventName,
                ping,
                connectionOptions,
                consoleDebug: config.debugger.consoleDebug
              })
            );
          });

          success(ctx, body);
        } catch (e) {
          failed(ctx, e, 'Error reading io-debugger-client file');
        }
        break;
      case stacktraceJsFile:
        try {
          const body = await readDocument(searchStacktraceSrc());

          success(ctx, body);
        } catch (e) {
          failed(ctx, e, 'Error reading stacktrace source file!');
        }
        break;
      case reloadJs:
        try {
          const body = await readDocument(
            join(__dirname, '..', 'reload', 'reload.tpl')
          ).then(data => {
            const clientFileFn = _.template(data.toString());
            const connectionOptions = getSocketConnectionConfig(config);
            return getCacheVer(
              clientFileFn({
                reloadNamespace: reloadPath,
                eventName: reloadEventName,
                connectionOptions
              })
            );
          });

          success(ctx, body);
        } catch (e) {
          failed(ctx, e, 'Error reading io-reload-client file');
        }
        break;
      // Without the {} will get a Unexpected lexical declaration in case block  no-case-declarations
      case dummyJs: {
        // Purely for testing purpose
        // taking off your pants to fart
        const body = await dummyOutput();
        success(ctx, body);
        break;
      }
      default:
        await next();
    }
  };
};

// Export
module.exports = {
  getFeatureScripts,
  renderScriptsMiddleware
};
