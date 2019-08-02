// Keep the koa-nginx because its such a pain in the ass to integrate the http-proxy
// The worst part is - it doesn't support debug inside, so there is no way to understand
// what is happening inside http-proxy to debug it
const Proxy = require('koa-nginx');
const chalk = require('chalk');
const { toArray, logutil, stripFirstSlash } = require('../utils');
const debug = require('debug')('server-io-core:http-proxy');

/**
 * @param {array} proxies from config
 * @return {array} clean version
 */
const cleanProxiesConfig = proxies =>
  proxies
    .filter(proxyoptions => {
      if (!proxyoptions.target || !proxyoptions.context) {
        logutil(
          chalk.red('Missing target or source property for proxy setting!'),
          proxyoptions
        );
        return false; // ignore!
      }

      return true;
    })
    .map(pc => {
      pc.context = stripFirstSlash(pc.context);

      return pc;
    });

/**
 * @param {object} app Koa instance
 * @param {object} config from config
 * @return {void} nothing
 */
module.exports = function(app, config) {
  const proxies = toArray(config.proxies);
  const filtered = cleanProxiesConfig(proxies);
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
};
