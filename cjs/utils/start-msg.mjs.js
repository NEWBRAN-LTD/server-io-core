'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var constants = require('../lib/constants.mjs.js');

// use the console.table to show some fancy output

function startMsg (config) {
  if (process.env.NODE_ENV === 'test') {
    return // do nothing
  }
  const list = {};
  list.banner = `server-io-core (${config.version})`;
  const displayHost = Array.isArray(config.host) ? config.host[1] : config.host;
  list.hostname = [
    'http',
    config.https.enable ? 's' : '',
    '://',
    displayHost,
    ':',
    config.port
  ].join('');
  list.internal = `http://${constants.DEFAULT_HOST}:${config.port0}`;
  // show table
  if (process.env.DEBUG) {
    console.table(list); // need more work
  }
}

exports.startMsg = startMsg;
