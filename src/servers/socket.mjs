/**
 * Socket server generator
 */
import { Server } from 'socket.io' // 3.x import style
import socketCb from './socket-cb.mjs'
/**
 * @param {object} server http server instance
 * @param {object} config full config options
 * @return {object} io instance
 */
export default function socketIoGenerator (server, config) {
  let socketConfig = null
  // Force the socket.io server to use websocket protocol only
  if (config.socket.socketOnly) {
    socketConfig =
      config.socket.transportConfig && Array.isArray(config.socket.transportConfig)
        ? config.socket.transportConfig
        : ['websocket']
  }
  // Need to take this constructor out and re-use with the reload
  const io = new Server(server, socketConfig)
  if (Array.isArray(config.namespace) && config.namespace.length) {
    socketCb(io, config.namespace)
  }
  // Export it again
  return io
}
