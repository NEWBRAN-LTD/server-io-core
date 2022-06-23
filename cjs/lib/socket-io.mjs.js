'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var socket_ioClient = require('socket.io-client');
var socket_io = require('socket.io');

// just wrapper to socket.io

class WSServer extends socket_io.Server {}

const WSClient = (url) => socket_ioClient.io(url, {
  transports: ['websocket']
});

exports.WSClient = WSClient;
exports.WSServer = WSServer;
