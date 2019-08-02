// just setup the server for reuse later
const serverIoCore = require('../../index');
const { join } = require('path');
const _ = require('lodash');
// return
module.exports = function(extra = {}) {
  return serverIoCore(_.extend({
    debugger: false,
    reload: false,
    webroot: join(__dirname, 'demo', 'dist', 'base')
  }, extra));
}
