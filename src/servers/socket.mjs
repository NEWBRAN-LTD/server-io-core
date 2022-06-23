/**
 * Socket server generator
 */
import { WSServer } from '../lib/socket-io.mjs'
import { socketCb } from './socket-cb.mjs'
/**
 * @param {object} server http server instance
 * @param {object} config full config options
 * @return {object} io instance
 */
export function socketIoGenerator (server, config) {
  // Force the socket.io server to use websocket protocol only
  let socketConfig = ['websocket']
  // if we want to use different protocol
  if (config.socket.socketOnly &&
    config.socket.transportConfig &&
    Array.isArray(config.socket.transportConfig)
  ) {
    socketConfig = config.socket.transportConfig
  }
  // Need to take this constructor out and re-use with the reload
  const io = new WSServer(server, { transports: socketConfig })
  if (Array.isArray(config.namespace) && config.namespace.length) {
    socketCb(io, config.namespace)
  }
  // Export it again
  return io
}
