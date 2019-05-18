/**
 * Socket server generator
 */
const socketIO = require('socket.io');
const socketCallback = require('callback');
// Export
/**
 * @param {object} server http server instance
 * @param {object} config full config options
 * @return {object} io instance
 */
module.exports = (server, config) => {
  // Logger = logger || logutil; should not provide anything here!
  let socketConfig = null;
  // Force the socket.io server to use websocket protocol only
  if (config.socket.socketOnly) {
    socketConfig =
      config.socket.transportConfig && Array.isArray(config.socket.transportConfig)
        ? config.socket.transportConfig
        : ['websocket'];
  }

  // Need to take this constructor out and re-use with the reload
  const io = socketIO(server, socketConfig);
  if (Array.isArray(config.namespace) && config.namespace.length) {
    socketCallback(io, config.namespace);
  }

  // Export it again
  return io;
};
