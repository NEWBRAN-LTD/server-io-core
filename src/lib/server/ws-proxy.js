// Try to use the http-proxy.ws
const HttpProxy = require('http-proxy');
const url = require('url');

// const chalk = require('chalk');
// Const { WS_PROXY } = require('../utils/constants');
const { ensureFirstSlash, inArray } = require('../utils');
const debug = require('debug')('server-io-core:ws-proxy');

const _ = require('lodash');

/**
 * @param {object} req http.server request object
 * @return {string} the strip slash of pathname
 */
const getPath = req => {
  const { pathname } = url.parse(req.url);
  // Debug('pathname', pathname, pathname.substring(0, 1), pathname.substring(1, pathname.length));
  return pathname.substring(0, 1) === '/'
    ? pathname.substring(1, pathname.length)
    : pathname;
};

/**
 * @param {boolean} socketIsEnabled if it's or not
 * @param {array} namespaceInUsed those we are using
 * @param {array} proxies from configuration
 * @return {array} result
 */
const filterNsp = (socketIsEnabled, namespaceInUsed, proxies) => {
  if (!socketIsEnabled) {
    return proxies;
  }

  return proxies
    .map(proxy => {
      if (proxy.namespace) {
        proxy.namespace = ensureFirstSlash(proxy.namespace);
      }

      return proxy;
    })
    .filter(proxy => {
      if (proxy.namespace) {
        return inArray(proxy.namespace, namespaceInUsed);
      }

      debug(`namespace is not provided!`, proxy);
      return false;
    });
};

/**
 * @param {array} proxies from configuration
 * @return {object} of proxy server with the namespace as key
 */
const generateProxyServers = proxies => {
  return proxies
    .map(proxy => {
      return {
        [proxy.namespace]: new HttpProxy.createProxyServer({
          target: proxy.target,
          ws: true
        })
      };
    })
    .reduce(_.merge, {});
};

/**
 * @param {object} webserver the http.createServer instance
 * @param {array} namespaceInUsed for filter
 * @param {array} proxies the clean configuration
 * @return {void} nothing
 */
const handleWsProxy = (webserver, namespaceInUsed, proxies) => {
  const proxyServers = generateProxyServers(proxies);
  debug('proxyServers', proxyServers)

  webserver.on('upgrade', function(req, socket, head) {
    const pathname = getPath(req);
    debug(`Hear the upgrade with ${pathname}`);
    // Proxy.ws(req, socket, head);
  });
};

/**
 * @param {object} webserver the http server instance
 * @param {object} config configuration
 * @param {boolean} socketIsEnabled is it
 * @param {array} namespaceInUsed of all the namespaces we are using
 * @return {function} a close method if any
 */
module.exports = function(webserver, config, socketIsEnabled, namespaceInUsed) {
  const proxies = filterNsp(socketIsEnabled, namespaceInUsed, config.wsProxies);
  if (proxies.length) {
    handleWsProxy(webserver, namespaceInUsed, proxies);
  }

  return () => {
    debug(`Calling the close proxy method`);
  };
};
