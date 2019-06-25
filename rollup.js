// This will be the rollup interface
// const serverIoCorePlugin = require('server-io-core/rollup')
const serverIoCore = require('./');
// @TODO
function rollupServerIoCorePlugin(options = {}) {
  // Force these options on config
  const config = Object.assign(options, {
    autoStart: false, // We must overwrite this for the plugin to work
    reload: {
      enable: true,
      verbose: false
    }
  });
  // Getting the fn(s)
  const { start, stop } = serverIoCore(config);
  // Listen to signal and close it
  ['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, () => {
      stop();
      process.exit();
    });
  });
  let running;
  // Return
  return {
    name: 'serverIo',
    ongenerate() {
      if (!running) {
        running = true;
        start();
      }
    }
  };
}

// Export
module.exports = rollupServerIoCorePlugin;
