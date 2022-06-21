// just wrapper to socket.io
import { io } from 'socket.io-client'
import { Server } from 'socket.io'

export class WSServer extends Server {}

export const WSClient = (url) => io(url, {
  transports: ['websocket']
})
