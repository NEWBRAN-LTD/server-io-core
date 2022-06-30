'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var socket_ioClient = require('socket.io-client');
var socket_io = require('socket.io');

// just wrapper to socket.io
// Socket.io Server
class WSServer extends socket_io.Server {}
// Socket.io node client
const WSClient = (url, config = {}) => socket_ioClient.io(url, Object.assign({
  transports: ['websocket']
}, config));

exports.WSClient = WSClient;
exports.WSServer = WSServer;
