'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var socket_ioClient = require('socket.io-client');
var socket_io = require('socket.io');
var constants = require('./constants.mjs.js');
require('debug');
require('../utils/open.mjs.js');
require('../utils/common.mjs.js');
require('../utils/config/defaults.mjs.js');
var utils = require('@jsonql/utils');

// just wrapper to socket.io
// Socket.io Server
class WSServer extends socket_io.Server {}
// Socket.io node client
const WSClient = (url, config = {}) => socket_ioClient.io(url, utils.extend({
  transports: constants.TRANSPORT
}, config));

exports.WSClient = WSClient;
exports.WSServer = WSServer;
