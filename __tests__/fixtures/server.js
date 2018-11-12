// just setup the server for reuse later

const serverIoCore = require('../../index');
const { join } = require('path');

module.exports = function(autoStart = true) {
  return serverIoCore({
    autoStart,
    debugger: false,
    reload: false,
    webroot: join(__dirname, 'demo', 'dist', 'base')
  });
}
