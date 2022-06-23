'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var bodyParser = require('koa-bodyparser');
var renderScriptsMiddleware = require('./injector/render-scripts-middleware.mjs.js');
var scriptInjectorMiddleware = require('./injector/script-injector-middleware.mjs.js');
var index = require('./favicon/index.mjs.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var bodyParser__default = /*#__PURE__*/_interopDefaultLegacy(bodyParser);

/**
 * this register all the required middlewares
 */
// main
function registerMiddlewares (app, config) {
  let addDebugger = false;
  const addReload = config.reload.enable;
  let middlewares = [bodyParser__default["default"]()];
  if (config.favicon !== false) {
    middlewares.push(index.faviconMiddlewareGenerator(config));
  }
  // Make sure the namespace is correct first
  if (config.debugger.enable) {
    const namespace = config.debugger.namespace;
    if (!namespace) {
      config.debugger.namespace = '/debugger-io';
    } else if (namespace.substr(0, 1) !== '/') {
      config.debugger.namespace = '/' + namespace;
    }
    addDebugger = config.debugger.client !== false;
  }
  // Live reload and inject debugger
  // This part inject the scripts into the html files
  if (addReload || addDebugger) {
    middlewares.push(renderScriptsMiddleware.renderScriptsMiddleware(config));
  }
  // @BUG the injector interfere with the normal operation
  if (addReload || addDebugger || config.inject.enable) {
    middlewares.push(scriptInjectorMiddleware.scriptsInjectorMiddleware(config));
  }
  // Extra middlewares pass directly from config
  if (Array.isArray(config.middlewares)) {
    middlewares = middlewares.concat(config.middlewares);
  } else {
    middlewares.push(config.middlewares);
  }
  const ctn = middlewares.length;
  // Now inject the middlewares
  if (ctn) {
    // But the problem with Koa is the ctx.state is not falling through
    // all the way, so we might need to add the middleware in stack
    // with app.use.apply(app, [middlewares_sub_array]);
    middlewares.forEach(m => app.use(m));
  }
  // Just return the number of middlewares
  return ctn
}

exports.registerMiddlewares = registerMiddlewares;
