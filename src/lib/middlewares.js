/* eslint no-unused-vars: 0 */
/**
 * The main server that wrap in the stream
 */
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
// Const chalk = require('chalk')
const helmet = require('koa-helmet');
const bodyparser = require('koa-bodyparser');

// Shorthands
// const join = path.join
const isarray = Array.isArray;
// Properties
// const { createConfiguration } = require('./options')
// Modules
// const { logutil, stripFirstSlash } = require('./utils/')
// Servers
// const { mockServer } = require('./server');
// Injectors
const { scriptsInjectorMiddleware, renderScriptsMiddleware } = require('./injector');
// Add in v1.1.0
const faviconMiddleware = require('./favicon');
const debug = require('debug')('server-io-core:middlewares');

const { httpProxy } = require('./server');

/**
 * Object for the other socket enable app to use
 * @param {object} app the koa instance
 * @param {object} config pass from config
 * @return {object} just the mockServerInstance
 */
module.exports = function(app, config) {
  const addReload = config.reload.enable;
  let addDebugger = false;

  // Default callbacks
  // const closeFn = { close: () => {} };
  // Properties
  let middlewares = [bodyparser()];
  // Start adding middlewares
  /* remove the noCache because it keeps complaint and complaint 
    and if you look at the source code, its beyound stupid!
    also if I chanage to their new noCache - it's broken 
  if (config.development) {
    middlewares.push(helmet.noCache());
  }
  */
  // Adding the favicon middleware
  if (config.favicon !== false) {
    middlewares.push(faviconMiddleware(config));
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
    middlewares.push(renderScriptsMiddleware(config));
  }

  // @BUG the injector interfere with the normal operation
  if (addReload || addDebugger || config.inject.enable) {
    middlewares.push(scriptsInjectorMiddleware(config));
  }

  // Extra middlewares pass directly from config
  if (typeof config.middlewares === 'function') {
    middlewares.push(config.middlewares);
  } else if (isarray(config.middlewares)) {
    middlewares = middlewares.concat(config.middlewares);
  }

  // Now inject the middlewares
  if (middlewares.length) {
    // But the problem with Koa is the ctx.state is not falling through all the way
    // so we might need to add the middleware in stack
    // with app.use.apply(app, [middlewares_sub_array]);
    middlewares.forEach(m => app.use(m));
  }

  httpProxy(app, config);

  // This is the end - we continue in the next level to construct the server
  // @TODO this return is just an empty placeholder function so we should remove it
  return {
    // UnwatchMockFn
  };
};
