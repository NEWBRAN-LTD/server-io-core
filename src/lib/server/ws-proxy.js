/* eslint-disable */
// Proxy the web socket this is tricky

const HttpProxy = require('http-proxy');
const chalk = require('chalk');
const { WS_PROXY } = require('../utils/constants');
const { logutil } = require('../utils');
const debug = require('debug')('server-io-core:ws-proxy');
const { inspect } = require('util');
/**
 * @param {object} config the full configuration object
 * @param {object} webserver the server instance
 * @param {boolean} socketIsEnabled for checking other options than decided what to do
 * @return {void} nothing
 */
module.exports = function(config, webserver, socketIsEnabled) {
  const opt = config[WS_PROXY];
  if (opt.enable === true) {
    if (socketIsEnabled) {
      logutil(
        chalk.yellow(
          `[${WS_PROXY} warning] The socket is enabled, so your proxy will affect your normal socket operation`
        )
      );
    }
    debug('start proxy server with', opt);
    // debug('wsProxy url', proxyUrl);
    const proxyServer = new HttpProxy.createProxyServer({
      target: opt.target
    });
    webserver.on('upgrade', function(req, socket, head) {
      debug('listening on upgrade event');
      // @TODO if there is more options in the future to overwrite something, this will be the place
      proxyServer.ws(req, socket, head);
    });
    // Return it
    return proxyServer;
  }
  debug('Proxy socket server is not enabled');
  // Return a dummy
  return { close: () => {} };
};
