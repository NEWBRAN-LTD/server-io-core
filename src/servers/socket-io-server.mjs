/**
 * Socket server generator
 */
import { WSClient, WSServer } from '../lib/socket-io.mjs'
import { TRANSPORT } from '../lib/constants.mjs'
/**
 * @param {object} server http server instance
 * @param {object} config full config options
 * @return {object} io instance
 */
export function socketIoGenerator (server, config) {
  // Force the socket.io server to use websocket protocol only
  let socketConfig = TRANSPORT
  // if we want to use different protocol
  if (config.socket.socketOnly &&
    config.socket.transportConfig &&
    Array.isArray(config.socket.transportConfig)
  ) {
    socketConfig = config.socket.transportConfig
  }
  // Need to take this constructor out and re-use with the reload
  const io = new WSServer(server, {
    transports: socketConfig,
    path: config.socket.path // @TODO custom path new in V2.2.0
  })
  if (Array.isArray(config.namespace) && config.namespace.length) {
    socketCb(io, config.namespace)
  }
  // Export it again
  return io
}
// V1.0.2
// We create a custom namespace that allow a third party module to call it
// then pass a callback to handle this calls
// also pass this to the callback for the developer to use
function socketCb (io, namespace) {
  const ctn = namespace.length
  for (let i = 0; i < ctn; ++i) {
    const { path, callback } = namespace[i]
    if (
      path && typeof path === 'string' &&
      callback && typeof callback === 'function'
    ) {
      const nsp = io.of(path)
      callback(nsp, io, WSClient)
    }
  }
}
