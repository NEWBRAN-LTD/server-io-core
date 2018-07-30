'use strict';
/**
 * The socket.io server and reporting
 */
// const _ = require('lodash');
const util = require('util');
const chalk = require('chalk');
const { logutil } = require('../utils/helper');
const { table, parseObj, displayError } = require('./helpers');
const debug = require('debug')('gulp-server-io:watchers');
/**
 * DebuggerServer
 * @param {object} config - the full configuration object
 * @param {object} io socket server instance
 * @return {function} close method
 */
module.exports = function(config, io) {
  // Show if this is running
  logutil(
    chalk.white('[debugger] ') +
      chalk.yellow('server is running') +
      ' ' +
      chalk.white(config.version)
  );
  // Run
  const nsp = io.of(config.debugger.namespace);
  // Start
  nsp.on('connection', function(socket) {
    // Announce to the client that is working
    socket.emit('hello', config.debugger.hello);
    // Listen
    socket.on('debugger', function(data) {
      try {
        // Provide a logger
        /*
        if (logger && typeof logger === 'function') {
          logger(data); // @TODO what to do with the logger
        } */
        // Console log output
        let time = new Date().toString();
        // Output to console
        logutil(chalk.yellow('io debugger msg @ ' + time));
        let error = parseObj(data);
        if (typeof error === 'string') {
          table([chalk.yellow('STRING TYPE ERROR'), chalk.red(error)]);
        } else if (typeof error === 'object') {
          // Will always be a object anyway
          displayError(error);
        } else {
          // Dump the content out
          table([
            chalk.cyan('UNKNOWN ERROR TYPE'),
            chalk.red(util.inspect(data, false, 2))
          ]);
        }
      } catch (e) {
        debug('emit internal error', e);
      }
    });
    // Extra listener
    socket.on('disconnect', () => {
      logutil('Debugger client disconnected');
    });
  }); // End configurable name space

  // return a close method
  return () => {
    // Get Object with Connected SocketIds as properties
    const connectedNameSpaceSockets = Object.keys(nsp.connected);
    connectedNameSpaceSockets.forEach(socketId => {
      // Disconnect Each socket
      nsp.connected[socketId].disconnect();
    });
    // Remove all Listeners for the event emitter
    nsp.removeAllListeners();
    delete io.nsps[config.debugger.namespace];
  };
};

// EOF
