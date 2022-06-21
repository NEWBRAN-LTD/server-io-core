// Instead of include the different websocket implmentation
// we create a wrapper to make it compatible to different lib in the future
import WebSocket, { WebSocketServer } from 'ws'

export class WSServer extends WebSocketServer {

}

export class WSClient extends WebSocket {

}
