const { createConfiguration } = require('./src/lib/options');
const { serverIoCore } = require('./src');
/**
 * Main entry point for server-io-core
 * @param {object} config options
 * @return {object} http server instance
 * @api public
 */
module.exports = function(config = {}) {
  const opts = createConfiguration(config);
  opts.__processed__ = true;
  return serverIoCore(opts);
};
