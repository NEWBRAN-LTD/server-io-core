/**
 * The socket.io server and reporting
 */
import util from 'node:util'
import chalk from 'chalk'
import { logutil, getDebug } from '../../utils'
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
    chalk.white('[debugger] ') +
      chalk.yellow('server is running') +
      ' ' +
      chalk.white(config.version) +
      (config.debugger.broadcast ? chalk.green('[broadcasting]') : '')
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
        logutil(chalk.yellow('io debugger msg @ ' + time))
        const error = parseObj(data)
        if (config.debugger.broadcast) {
          nsp.emit('broadcastdebug', { time, error })
        }

        if (typeof error === 'string') {
          table([chalk.yellow('STRING TYPE ERROR'), chalk.red(error)])
        } else if (typeof error === 'object') {
          // Will always be a object anyway
          displayError(error)
        } else {
          // Dump the content out
          table([
            chalk.cyan('UNKNOWN ERROR TYPE'),
            chalk.red(util.inspect(data, false, 2))
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
