/* eslint-disable */
// Proxy the web socket this is tricky
// @2019-05-07 still couldn't figure out what went wrong with the node-http-proxy
// also if we want to preserve the other operation. Using this dummy way to create
// a proxy might be the best option
const HttpProxy = require('http-proxy');
const chalk = require('chalk');
const { WS_PROXY } = require('../utils/constants');
const { logutil } = require('../utils');
const debug = require('debug')('server-io-core:ws-proxy');
const { inspect } = require('util');
const socketIoClient = require('socket.io-client');
/**
 * @param {object} config the full configuration object
 * @param {object} io the socket.io server instance
 * @param {boolean} socketIsEnabled for checking other options than decided what to do
 * @return {void} nothing
 */
module.exports = function(config, io, socketIsEnabled) {
  const opt = config[WS_PROXY];
  if (opt.enable === true && socketIsEnabled) {
    debug('start proxy server with', opt);
    // debug('wsProxy url', proxyUrl);
    


    /*
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
    */
  } else {
    logutil(
      chalk.yellow(
        `[${WS_PROXY} warning] The socket is NOT enabled. Proxy will not work!`
      )
    );
  }
  // Return a dummy
  return { close: () => {} };
};
