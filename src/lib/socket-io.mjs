// just wrapper to socket.io
import { io } from 'socket.io-client'
import { Server } from 'socket.io'
import { TRANSPORT } from './constants.mjs'
// Socket.io Server
export class WSServer extends Server {}
// Socket.io node client
export const WSClient = (url, config = {}) => io(url, Object.assign({
  transports: TRANSPORT
}, config))
