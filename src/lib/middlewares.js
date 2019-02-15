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
const { toArray, logutil } = require('./utils/');
// Servers
const { mockServer } = require('./server');
// Injectors
const { scriptsInjectorMiddleware, renderScriptsMiddleware } = require('./injector');
/**
 * Export @TODO we also need to generate the socket server here, export the io
 * object for the other socket enable app to use
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
  const closeFn = { close: () => {} };
  let mockServerInstance = closeFn;
  let unwatchMockFn = () => {};
  // Properties
  let middlewares = [bodyparser()];
  // Start adding middlewares
  if (config.development) {
    middlewares.push(helmet.noCache());
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
  const filtered = proxies.filter(proxyoptions => {
    // When proxy socket we don't need the context
    if (!proxyoptions.target || (proxyoptions.ws !== true && !proxyoptions.context)) {
      logutil(
        chalk.red('Missing target or source property for proxy setting!'),
        proxyoptions
      );
      return false; // ignore!
    }

    return true;
  });

  // First need to setup the mock json server
  // @2010-05-08 remove the development flag it could be confusing
  // @TODO update the proxy defintion to work with koa-nginx
  if (config.mock.enable && config.mock.json) {
    // Here we overwrite the proxies so the proxy get to the mock server
    const _mock = mockServer(config);
    mockServerInstance = _mock.server;
    unwatchMockFn = _mock.unwatchFn;
    // Need to double check the mockServer will crash with the proxies
    const _proxies = _mock.proxies;
    const _mockProxiesKey = _proxies.map(p => p.context);
    const _proxiesKey = filtered.map(p => p.context);
    const originalLen = _proxies.length + _proxiesKey.length;
    const newUnionProxies = _.union(_proxies, _proxiesKey);
    if (originalLen === newUnionProxies.length) {
      proxies = filtered.concat(_proxies);
    } else {
      logutil(
        chalk.red('The proxies and mock server option crashed! Please double check both.')
      );
      // Reset the proxies
      proxies = [];
      // Stop the mock server
      unwatchMockFn();
      mockServerInstance.close();
    }
  }

  if (proxies.length) {
    middlewares.push(
      Proxy.proxy({
        proxies: proxies,
        proxyTimeout: config.proxyTimeout,
        logLevel: config.development ? 'debug' : 'error'
      })
    );
  }

  // Now inject the middlewares
  if (middlewares.length) {
    // @TODO at the moment, we only accept function middlewares
    // but the problem with Koa is the ctx.state is not falling through all the way
    // so we might need to add the middleware in stack
    // with app.use.apply(app, [middlewares_sub_array]);
    middlewares.filter(m => typeof m === 'function').forEach(m => app.use(m));
  }

  // This is the end - we continue in the next level to construct the server
  return {
    mockServerInstance,
    unwatchMockFn
  };
};
