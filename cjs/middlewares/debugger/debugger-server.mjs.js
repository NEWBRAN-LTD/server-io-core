'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var util = require('node:util');
var debug$1 = require('../../utils/debug.mjs.js');
require('../../utils/open.mjs.js');
var common = require('../../utils/common.mjs.js');
require('../../utils/config/defaults.mjs.js');
var helpers = require('./helpers.mjs.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var util__default = /*#__PURE__*/_interopDefaultLegacy(util);

/**
 * The socket.io server and reporting
 */
const debug = debug$1.getDebug('debugger');

/**
 * DebuggerServer
 * @param {object} config - the full configuration object
 * @param {object} io socket server instance
 * @return {function} close method
 */
function debuggerServer (config, io) {
  // Show if this is running
  common.logutil(
    '[debugger] ' +
      'server is running' +
      ' ' +
      config.version +
      (config.debugger.broadcast ? '[broadcasting]' : '')
  );
  // Run
  const nsp = io.of(config.debugger.namespace);
  // Start
  nsp.on('connection', (socket) => {
    // Announce to the client that is working
    socket.emit('hello', config.debugger.hello);
    // Listen
    socket.on(config.debugger.eventName, (data) => {
      try {
        // Console log output
        const time = new Date().toString();
        // Output to console
        common.logutil('io debugger msg @ ' + time);
        const error = helpers.parseObj(data);
        if (config.debugger.broadcast) {
          nsp.emit('broadcastdebug', { time, error });
        }

        if (typeof error === 'string') {
          helpers.table(['STRING TYPE ERROR', error]);
        } else if (typeof error === 'object') {
          // Will always be a object anyway
          helpers.displayError(error);
        } else {
          // Dump the content out
          helpers.table([
            'UNKNOWN ERROR TYPE',
            util__default["default"].inspect(data, false, 2)
          ]);
        }
      } catch (e) {
        debug('emit internal error', e);
      }
    });
    // Extra listener
    if (config.debugger.verbose) {
      socket.on('disconnect', () => {
        common.logutil('Debugger client disconnected');
      });
    }
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
  }
}

exports.debuggerServer = debuggerServer;
