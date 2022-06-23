// watcher
import { logutil, getDebug, extend } from '../../utils/index.mjs'
import { EVENT_NAME } from '../../lib/constants.mjs'
import { watcherGenerator } from '../watcher/index.mjs'
const debug = getDebug('reload')

/**
 * @v1.5.0 we create our own reload script and remove the old reload.js
 * because it keeps breaking down
 * This new method will call a fork fileWatcher function then pass the event
 * to the client script via socket.io namespace method
 * @param {array} filePaths array of files path to watch
 * @param {object} io socket io instance to create the namespace
 * @param {object} config the config.reload object
 * @return {function} unwatch callback
 */
export function reloadGenerator (filePaths, io, config) {
  const watcherCb = watcherGenerator(extend({ filePaths }, config))
  const props = watcherCb(true)
  // First setup the socket io namespace
  // debug('[reload][setup]', 'setup namespace', config.namespace);
  const nsp = io.of(config.namespace)
  nsp.on('connection', (socket) => {
    socket.emit('hello', config.hello)
  })
  props.on(EVENT_NAME, files => {
    debug('[reload][change]', config.eventName, files)
    nsp.emit(config.eventName, files)
  })
  // Return a unwatch callback
  return () => {
    if (config.verbose) {
      logutil('[reload][exit]')
    }
    watcherCb(false)
    // Exit the namespace
    const connectedNameSpaceSockets = Object.keys(nsp.connected) // Get Object with Connected SocketIds as properties
    connectedNameSpaceSockets.forEach(socketId => {
      nsp.connected[socketId].disconnect() // Disconnect Each socket
    })
    nsp.removeAllListeners() // Remove all Listeners for the event emitter
    delete io.nsps[config.namespace]
  }
}
