// Proxy front setup V1.2.0
const http = require('http');
const HttpProxy = require('http-proxy');
const url = require('url');
const { ensureFirstSlash, inArray } = require('../utils');
const debug = require('debug')('server-io-core:create-proxy');
const _ = require('lodash');

/**
 * Ported from jsonql-ws-server, get the current calling path
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
 * Web proxies handler
 * @param {array} webProxies config
 * @param {int} port the server-io-core port running on
 * @return {object} the http server instance
 */
const handleWebProxies = (webProxies, port) => {
  const webProxyServer = HttpProxy.createProxyServer();
  // Handle the web proxy first
  return http.createServer(function(req, res) {
    const pathname = getPath(req);
    debug(`catch the ${pathname}`);
    let handled = false;
    const ctn0 = webProxies.length;
    for (let i = 0; i < ctn; ++i) {
      let webProxy = webProxies[i];
      if (webProxy.context === pathname) {
        debug(`${pathname} handled by ${webProxy.target}`);
        handled = true;
        return webProxyServer(req, res, { target: webProxy.target });
      }
    }

    if (!handled) {
      debug(`pass to the default`);
      webProxyServer(req, res, { target: `http://localhost:${port}` });
    }
  });
};

function createSocketProxyServers(socketProxies, namespaceInUsed) {
  return socketProxies
    .map(proxy => {
      if (!inArray(proxy.context, namespaceInUsed)) {
        return {
          [proxy.context]: new HttpProxy.createProxy({
            target: proxy.target,
            ws: true
          })
        };
      }

      console.error(`${proxy.context} is in use internally!`);
    })
    .reduce(_.merge, {});
}

/**
 * Create a front proxy server
 * @param {object} webserver http.createServer instance
 * @param {object} opts configuration
 * @param {int} port the number this proxy server run on
 * @param {array} namespaceInUsed for filter out namespace
 * @param {array} socketProxies socket proxy config
 * @param {array} webProxies web proxy config
 * @return {void} nothing
 */
module.exports = function(
  webserver,
  opts,
  port,
  namespaceInUsed,
  socketProxies,
  webProxies
) {
  const server = handleWebProxies(webProxies, port);
  const ctn = socketProxies.length;
  const socketProxyServers = createSocketProxyServers(socketProxies, namespaceInUsed);
  // Now handle the socket
  server.on('upgrade', function(req, socket, head) {
    const pathname = getPath(req);
    if (socketProxyServers[pathname]) {
      socketProxyServers[pathname].ws(req, socket, head);
    } else {
      defaultProxy.ws(req, socket, head);
    }
  });

  // Return the server for other operation
  return server;
};