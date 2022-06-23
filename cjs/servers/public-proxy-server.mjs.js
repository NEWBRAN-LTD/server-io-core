'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var http = require('node:http');
var url = require('node:url');
var HttpProxy = require('http-proxy');
var constants = require('../lib/constants.mjs.js');
var debug$1 = require('../utils/debug.mjs.js');
require('../utils/open.mjs.js');
var common = require('../utils/common.mjs.js');
require('../utils/config/defaults.mjs.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var http__default = /*#__PURE__*/_interopDefaultLegacy(http);
var url__default = /*#__PURE__*/_interopDefaultLegacy(url);
var HttpProxy__default = /*#__PURE__*/_interopDefaultLegacy(HttpProxy);

/*
This will be the front that facing the public
Then we proxy the connection to the service behind it,
This server will get call last in the stack - waiting for other service started first
*/
const debug = debug$1.getDebug('publix-proxy-server');
// Main - async is not right too, this should return an observable
async function createPublicProxyServer (config) {
  // prepare
  const publicPort = config.port;
  const publicHost = Array.isArray(config.host) ? config.host[0] : config.host;
  const internalPort = config[constants.INTERNAL_PORT];
  const internalHost = `http://${constants.DEFAULT_HOST}:${internalPort}`;
  // proxy to internal
  const proxy = new HttpProxy__default["default"]({ target: internalHost, ws: true });
  debug('proxy point to ', internalHost);
  // prepare the other proxies
  const { httpProxies, wsProxies } = prepareProxiesConfig(config);
  // create public server
  const publicServer = http__default["default"].createServer((req, res) => {
    const { pathname } = url__default["default"].parse(req.url);
    if (httpProxies[pathname]) {
      debug('http proxy catched', pathname);
      return httpProxies[pathname].web(req, res)
    }
    proxy.web(req, res);
  }).on('upgrade', (req, socket, head) => {
    const { pathname } = url__default["default"].parse(req.url);
    debug('ws pathname', pathname);
    if (wsProxies[pathname]) {
      debug('ws proxy catched', pathname);
      return wsProxies[pathname].ws(req, socket, head)
    }
    proxy.ws(req, socket, head);
  });

  return {
    startPublic: async () => {
      return new Promise(resolve => {
        publicServer.listen(
          publicPort,
          publicHost,
          () => {
            const info = updateInfo(publicServer.address());
            const msg = `${info.hostname}:${info.port} --> ${internalHost}`;
            debug('publicServer', info, msg);
            common.logutil(msg);
            resolve(info);
          }
        );
      })
    },
    stopPublic: () => {
      publicServer.close();
    }
  }
}

// just move the address to hostname
function updateInfo (info) {
  for (const key in info) {
    if (key === 'address') {
      info.hostname = info[key];
    }
  }
  return info
}

// prepare the user supplied proxies
function prepareProxiesConfig ({ proxies }) {
  const httpProxies = {};
  const wsProxies = {};
  proxies.forEach(proxyConfig => {
    debug('proxyConfig', proxyConfig);
    const { type } = proxyConfig;
    if (type === 'http') {
      const { context, target } = proxyConfig;
      if (context && target) {
        httpProxies[context] = new HttpProxy__default["default"]({ target });
      } else {
        debug('mis-config http proxy', proxyConfig);
      }
    } else if (type === 'ws') {
      const { context, target } = proxyConfig;
      if (context && target) {
        wsProxies[context] = new HttpProxy__default["default"]({ target, ws: true });
      } else {
        debug('mis-config ws proxy', proxyConfig);
      }
    } else {
      debug('unknown proxy config', proxyConfig);
    }
  });
  debug('proxies http:', common.objLength(httpProxies), 'ws:', common.objLength(wsProxies));
  return { httpProxies, wsProxies }
}

exports.createPublicProxyServer = createPublicProxyServer;
