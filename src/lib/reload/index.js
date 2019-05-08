const _ = require('lodash');
const chalk = require('chalk');
const watcher = require('../watcher');
const { logutil } = require('../utils/');
const debug = require('debug')('server-io-core:watchers');
// Const serverReload = require('./server-reload');
/**
 * @v1.5.0 we create our own reload script and remove the old reload.js
 * because it keeps breaking down
 * This new method will call a fork fileWatcher function then pass the event
 * to the client script via socket.io namespace method
 * @param {array} filePaths array of files path to watch
 * @param {object} io socket io instance to create the namespace
 * @param {object} config the config.reload object
 * @return {function} unwatch callback
 */
module.exports = function(filePaths, io, config) {
  const props = watcher(_.extend({ filePaths }, config));
  // First setup the socket io namespace
  // debug('[reload][setup]', 'setup namespace', config.namespace);
  const nsp = io.of(config.namespace);

  nsp.on('connection', function(socket) {
    socket.emit('hello', config.hello);
  });

  props.on('change', files => {
    debug('[reload][change]', config.eventName, files);
    nsp.emit(config.eventName, files);
  });

  // Return a unwatch callback
  return () => {
    if (config.verbose) {
      logutil(chalk.yellow('[reload][exit]'));
    }

    props.emit('exit');
    // Exit the namespace
    const connectedNameSpaceSockets = Object.keys(nsp.connected); // Get Object with Connected SocketIds as properties
    connectedNameSpaceSockets.forEach(socketId => {
      nsp.connected[socketId].disconnect(); // Disconnect Each socket
    });
    nsp.removeAllListeners(); // Remove all Listeners for the event emitter
    delete io.nsps[config.namespace];
  };
};

// Re-export it
// exports.serverReload = serverReload;
