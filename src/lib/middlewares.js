/* eslint no-unused-vars: 0 */
/**
 * The main server that wrap in the stream
 */
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const helmet = require('koa-helmet');
const bodyparser = require('koa-bodyparser');
const Proxy = require('koa-nginx');
// Shorthands
const join = path.join;
const isarray = Array.isArray;
// Properties
const { createConfiguration } = require('./options');
// Modules
const { toArray, logutil, stripFirstSlash } = require('./utils/');
// Servers
// const { mockServer } = require('./server');
// Injectors
const { scriptsInjectorMiddleware, renderScriptsMiddleware } = require('./injector');
// Add in v1.1.0
const faviconMiddleware = require('./favicon');
const debug = require('debug')('server-io-core:middlewares');
/**
 * Object for the other socket enable app to use
 * @param {object} app the koa instance
 * @param {object} config pass from config
 * @return {object} just the mockServerInstance
 */
module.exports = function(app, config) {
  const addReload = config.reload.enable;
  let addDebugger = false;
  // Fixed on 1.4.0-beta.3
  let proxies = toArray(config.proxies);
  // Default callbacks
  // const closeFn = { close: () => {} };
  // Properties
  let middlewares = [bodyparser()];
  // Start adding middlewares
  if (config.development) {
    middlewares.push(helmet.noCache());
  }

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

  // Config the proxies
  let filtered = proxies
    .filter(proxyoptions => {
      // When proxy socket we don't need the context
      if (!proxyoptions.host || !proxyoptions.context) {
        logutil(
          chalk.red('Missing target or source property for proxy setting!'),
          proxyoptions
        );
        return false; // ignore!
      }

      return true;
    })
    .map(pc => {
      if (pc.context) {
        pc.context = stripFirstSlash(pc.context);
      }

      return pc;
    });

  // Now inject the middlewares
  if (middlewares.length) {
    // But the problem with Koa is the ctx.state is not falling through all the way
    // so we might need to add the middleware in stack
    // with app.use.apply(app, [middlewares_sub_array]);
    middlewares.forEach(m => app.use(m));
  }

  // Last in the chain
  if (filtered.length) {
    debug('proxies', filtered);
    // Logutil('filtered', filtered);
    app.use(
      Proxy.proxy({
        proxies: filtered,
        proxyTimeout: config.proxyTimeout,
        logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug' // Config.development ? 'debug' : 'error'
      })
    );
  }

  // This is the end - we continue in the next level to construct the server
  // @TODO this return is just an empty placeholder function so we should remove it
  return {
    // UnwatchMockFn
  };
};
