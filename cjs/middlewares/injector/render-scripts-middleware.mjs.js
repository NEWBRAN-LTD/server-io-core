'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('node:fs');
var path = require('node:path');
var utils = require('@jsonql/utils');
require('debug');
var constants = require('../../lib/constants.mjs.js');
require('../../utils/open.mjs.js');
var common = require('../../utils/common.mjs.js');
require('../../utils/config/defaults.mjs.js');
var helpers = require('./helpers.mjs.js');
var reload_tpl = require('../reload/reload.tpl.mjs.js');
require('../reload/reload.mjs.js');
var client_tpl = require('../debugger/client.tpl.mjs.js');
require('../debugger/debugger-server.mjs.js');
var cordova = require('./cordova.mjs.js');
var qunit = require('./qunit.mjs.js');
var template = require('lodash.template');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var template__default = /*#__PURE__*/_interopDefaultLegacy(template);

/**
 * This will combine debugger and reload client file overwrite in one place
 * there will be just one middleware to handle them
 */
// get where are we
const __dirname$1 = common.getDirname((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('middlewares/injector/render-scripts-middleware.mjs.js', document.baseURI).href)));
/**
 * V2.2.0 add addtional config to the socket templates
 */
const prepareSocketClient = (str, config) => {
  return utils.formatStr(str, `, path: '${config.socket.path}'`)
};

/**
 * Get scripts paths
 * @param {object} config the main config object
 * @return {object} parse file paths
 */
const getFeatureScripts = function (config) {
  const socketIoJs = [config.socket.path, 'socket.io.js'].join('');
  // Debugger
  const debuggerPath = config.debugger.namespace;
  const eventName = config.debugger.eventName;
  const debuggerJs = [debuggerPath, config.debugger.js].join('/');
  const stacktraceJsFile = [debuggerPath, constants.stacktraceName].join('/');
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
  }
};

/**
 * Find the stack track file
 * @return {string} path to stacktrace file
 */
const searchStacktraceSrc = () => {
  // @NOTE this is problematic
  const stacktraceFile = path.join(
    'stacktrace-js',
    'dist',
    'stacktrace-with-promises-and-json-polyfills.js'
  );
  const projectRoot = path.join(__dirname$1, '..', '..', '..');
  const here = path.resolve('./');
  const fullPath = path.join(projectRoot, 'node_modules', stacktraceFile);
  const libPath = path.join(projectRoot, 'lib', stacktraceFile);
  const searchPaths = [libPath, fullPath, path.join(here, 'node_modules', stacktraceFile)];
  helpers.debug('searchPaths', searchPaths);
  return searchPaths
    .filter(f => {
      return fs__default["default"].existsSync(f)
    })
    .reduce((first, next) => {
      return next
    }, null)
};

/**
 * Allow user supply overwrite files
 * @param {object} ctx koa
 * @param {object} config options
 * @return {boolean} true has false not
 */
async function hasExtraVirtualOverwrite (ctx, config) {
  const features = [cordova.prepareCordova, qunit.prepareQunit]
    .map(fn => fn(config))
    .reduce((a, b) => Object.assign(a, b), {});
  const key = ctx.url;
  if (features[key]) {
    return await features[key](ctx, config)
  }
  return false
}

/**
 * This become a standalone middleware and always going to inject to the app
 * @param {object} config the main config object
 * @return {undefined} nothing
 * @api public
 */
function renderScriptsMiddleware (config) {
  const {
    debuggerPath,
    eventName,
    reloadPath,
    reloadEventName,
    debuggerJs,
    stacktraceJsFile,
    reloadJs
  } = getFeatureScripts(config);
  // Export middleware
  return async function middleware (ctx, next) {
    await next();
    // Only catch certain methods
    if (ctx.method === 'GET') {
      const url = ctx.url;
      // debug('render-scripts-middleware', url)
      switch (url) {
        // Without the {} will get a Unexpected lexical declaration in case block  no-case-declarations
        case constants.dummyJs: {
          helpers.debug('catch script', constants.dummyJs);
          const body = await Promise.resolve('console.info(\'SERVER_IO_CORE\', true)');
          return helpers.success(ctx, body)
        }
        case reloadJs: {
          try {
            const body = await Promise.resolve(
              prepareSocketClient(reload_tpl.reloadTpl, config)
            ).then(data => {
              const clientFileFn = template__default["default"](data);
              const connectionOptions = common.getSocketConnectionConfig(config);
              return helpers.getCacheVer(
                clientFileFn({
                  reloadNamespace: reloadPath,
                  eventName: reloadEventName,
                  displayLog: config.reload.displayLog,
                  connectionOptions
                })
              )
            });
            helpers.success(ctx, body);
          } catch (e) {
            helpers.failed(ctx, e, 'Error reading io-reload-client file');
          }
          return // Terminate it
        }
        case stacktraceJsFile: {
          try {
            const body = await common.readDocument(searchStacktraceSrc());
            helpers.success(ctx, body);
          } catch (e) {
            helpers.failed(ctx, e, 'Error reading stacktrace source file!');
          }
          return // Terminate it
        }
        case debuggerJs: {
          try {
            const body = await Promise.resolve(
              prepareSocketClient(client_tpl.debuggerClientTpl, config)
            ).then(data => {
              // If they want to ping the server back on init
              const ping =
                typeof config.debugger.client === 'object' && config.debugger.client.ping
                  ? 'true'
                  : 'false';
              const serveDataFn = template__default["default"](data);
              const connectionOptions = common.getSocketConnectionConfig(config);
              return helpers.getCacheVer(
                serveDataFn({
                  debuggerPath,
                  eventName,
                  ping,
                  connectionOptions,
                  consoleDebug: config.debugger.consoleDebug
                })
              )
            });
            return helpers.success(ctx, body)
          } catch (e) {
            helpers.failed(ctx, e, 'Error reading io-debugger-client file');
          }
          return // Terminate it
        }
        default:
          // @2018-08-20 started @2022-06-22 additional features added
          if ((await hasExtraVirtualOverwrite(ctx, config)) === true) {
            helpers.debug('catch hasExtraVirtualOverwrite');
          }
      }
    }
  }
}

exports.getFeatureScripts = getFeatureScripts;
exports.hasExtraVirtualOverwrite = hasExtraVirtualOverwrite;
exports.prepareSocketClient = prepareSocketClient;
exports.renderScriptsMiddleware = renderScriptsMiddleware;
exports.searchStacktraceSrc = searchStacktraceSrc;
