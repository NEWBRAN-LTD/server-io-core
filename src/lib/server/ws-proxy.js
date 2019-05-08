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
const _ = require('lodash');

/**
 * @param {mixed} evt unknown pass by user
 * @return {mixed} false on fail
 */
const ensureEvents = evt => {
  if (typeof evt === 'string') {
    return [evt];
  }
  if (Array.isArray(evt) && evt.length) {
    return evt;
  }
  return false;
}

/**
 * generate the dummy pass around proxy
 * @param {object} config clean one
 * @return {object} passing back the object for destroy later
 */
const constructDummyProxy = (io, config) => {
  const client = socketIoClient(config.host);
  const server = io.of(config.namespace);
  client.on('connect', socket => {
    _.forEach(config.events, evt => {
      client.on(evt, function(...args) {
        server.emit(evt, args);
      });
    });
  });
}

/**
 * @param {object} config the full configuration object
 * @param {object} io the socket.io server instance
 * @param {boolean} socketIsEnabled for checking other options than decided what to do
 * @param {array} namespaceInUsed list of namespace already in use and filter the user one out
 * @return {void} nothing
 */
module.exports = function(config, io, socketIsEnabled, namespaceInUsed) {
  const opt = config[WS_PROXY];
  if (opt.enable === true && socketIsEnabled) {
    debug('start proxy server with', opt);
    let clients = {};
    let servers = {};
    _.forEach(config.target, target => {
      if (target.namespace && target.host) {
        const check = namespaceInUsed.filter(n => n === target.namespace);
        if (check.length) {
          logutil(chalk.red(`[wsProxy] The namespace "${target.name}" is already in use!`));
        } else {
          const evts = ensureEvents(target.events);
          if (evts === false) {
            logutil(chalk.red('[wsProxy] Missing events property'), chalk.yellow(target));
          } else {
            const { c, s } = constructDummyProxy(io, target);
            clients[target.namespace] = c;
            servers[target.namespace] = s;
          }
        }
      } else {
        logutil(chalk.red('[wsProxy] Missing namespace or host in your proxy property!'), chalk.yellow(target));
      }
    });
    return {
      close: () => {
        _.forEach(clients, (value, key) => {
          delete clients[key];
          delete servers[key];
        });
      }
    }
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
