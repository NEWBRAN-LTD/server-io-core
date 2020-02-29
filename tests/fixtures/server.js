// Just setup the server for reuse later
const serverIoCore = require('../../index');
const { join } = require('path');
const defaultOptions = {
  socket: false,
  debugger: false,
  reload: false,
  open: false,
  webroot: join(__dirname, 'demo', 'dist', 'base')
};
// Const debug = require('debug')('server-io-core:fixtures:server')
// Return
module.exports = function(extra = {}) {
  return serverIoCore(Object.assign(defaultOptions, extra));
};
