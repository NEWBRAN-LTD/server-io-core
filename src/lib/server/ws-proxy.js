/* eslint-disable */
// Proxy the web socket this is tricky
// @2019-05-07 still couldn't figure out what went wrong with the node-http-proxy
// also if we want to preserve the other operation. Using this dummy way to create
// a proxy might be the best option
const HttpProxy = require('http-proxy');
const chalk = require('chalk');
const { WS_PROXY } = require('../utils/constants');
const { logutil, ensureFirstSlash } = require('../utils');
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
  const nsp = config.namespace;
  const client = socketIoClient(config.host);
  const server = io.of(ensureFirstSlash(nsp));
  // client to server
  client.on('connect', () => {
    debug(`[wsProxy] connection to ${config.host} established`);
    _.forEach(config.events, evt => {
      // debug('[wsProxy] hooking up ', evt);
      // client to server
      client.on(evt, function(args) {
        debug('[wsProxy] client.on', evt, args);
        server.emit(evt, args);
      });
    });
  });
  // server to client
  server.on('connection', function(socket) {
    debug(`[wsProxy] nsp ${nsp} is listening ...`);
    _.forEach(config.events, evt => {
      // server to client
      socket.on(evt, function(args) {
        debug('[wsProxy] server.on', evt, args);
        client.emit(evt, args);
      });
    });
  });
  return {
    servers: {
      [nsp]: server
    },
    clients: {
      [nsp]: client
    }
  };
}

/**
 * Run the config to check and setup proxy
 * @param {object} config of the wsProxy
 * @param {object} io socket.io instance
 * @param {array} namespaceInUsed for checking
 * @return {object} servser and clients
 */
const setupProxy = (config, io, namespaceInUsed) => {
  let clients = {};
  let servers = {};
  let msg = '';
  debug('setupProxy', config.target);
  return config.target.map(target => {
    if (target.namespace && target.host) {
      const check = namespaceInUsed.filter(n => n === ensureFirstSlash(target.namespace));
      if (check.length) {
        msg = `[wsProxy] The namespace "${target.name}" is already in use!`;
        logutil(chalk.red(msg));
        debug(msg);
      } else {
        const evts = ensureEvents(target.events);
        if (evts === false) {
          msg = '[wsProxy] Missing events property';
          debug(msg);
          logutil(chalk.red(msg), chalk.yellow(target));
        } else {
          debug('[wsProxy] start proxy server with', config);
          logutil(chalk.yellow('[wsProxy] starting ...'));
          return constructDummyProxy(io, target);
        }
      }
    } else {
      msg = '[wsProxy] Missing namespace or host in your proxy property!';
      debug(msg);
      logutil(chalk.red(msg), chalk.yellow(target));
    }
    return {};
  }).reduce(_.merge, {clients: {}, servers: []})
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
    // debug('[wsProxy]', opt, socketIsEnabled, namespaceInUsed);
    const { clients, servers } = setupProxy(opt, io, namespaceInUsed);
    return {
      close: () => {
        _.forEach(clients, (value, key) => {
          delete clients[key];
          delete servers[key];
        });
      }
    }
  }
  if (!socketIsEnabled) {
    logutil(
      chalk.yellow(
        `[${WS_PROXY} warning] The socket is NOT enabled. Proxy will not work!`
      )
    );
  }
  // Return a dummy
  return { close: () => {} };
};
