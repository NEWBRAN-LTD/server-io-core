/**
 * The socket.io server and reporting
 */
import util from 'node:util'
import { logutil, getDebug } from '../../utils/index.mjs'
import { table, parseObj, displayError } from './helpers.mjs'
const debug = getDebug('debugger')

/**
 * DebuggerServer
 * @param {object} config - the full configuration object
 * @param {object} io socket server instance
 * @return {function} close method
 */
export default function debuggerServer (config, io) {
  // Show if this is running
  logutil(
    '[debugger] ' +
      'server is running' +
      ' ' +
      config.version +
      (config.debugger.broadcast ? '[broadcasting]' : '')
  )
  // Run
  const nsp = io.of(config.debugger.namespace)
  // Start
  nsp.on('connection', (socket) => {
    // Announce to the client that is working
    socket.emit('hello', config.debugger.hello)
    // Listen
    socket.on(config.debugger.eventName, (data) => {
      try {
        // Console log output
        const time = new Date().toString()
        // Output to console
        logutil('io debugger msg @ ' + time)
        const error = parseObj(data)
        if (config.debugger.broadcast) {
          nsp.emit('broadcastdebug', { time, error })
        }

        if (typeof error === 'string') {
          table(['STRING TYPE ERROR', error])
        } else if (typeof error === 'object') {
          // Will always be a object anyway
          displayError(error)
        } else {
          // Dump the content out
          table([
            'UNKNOWN ERROR TYPE',
            util.inspect(data, false, 2)
          ])
        }
      } catch (e) {
        debug('emit internal error', e)
      }
    })
    // Extra listener
    if (config.debugger.verbose) {
      socket.on('disconnect', () => {
        logutil('Debugger client disconnected')
      })
    }
  }) // End configurable name space
  // return a close method
  return () => {
    // Get Object with Connected SocketIds as properties
    const connectedNameSpaceSockets = Object.keys(nsp.connected)
    connectedNameSpaceSockets.forEach(socketId => {
      // Disconnect Each socket
      nsp.connected[socketId].disconnect()
    })
    // Remove all Listeners for the event emitter
    nsp.removeAllListeners()
    delete io.nsps[config.debugger.namespace]
  }
}
