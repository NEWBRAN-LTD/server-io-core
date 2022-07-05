// this is a pupeteer to control the serverIoCore server start restart etc
// the reason is we could use this to work with Cypress (or other test framework)
// to control this dev server
import { MASTER_MIND, AUTO_START, TRANSPORT } from './src/lib/constants.mjs'
import { WSClient } from './src/lib/socket-io.mjs'
import { logutil, getDebug } from './src/utils/index.mjs'
import { serverIoCore } from './index.mjs'
const debug = getDebug('mastermind')
// main
export async function masterMind (options = {}) {
  if (!options[MASTER_MIND]) {
    options[MASTER_MIND] = true // enable it
  }
  options[AUTO_START] = false // it must be false
  const {
    config,
    // webserver,
    // app,
    io,
    start,
    stop
  } = await serverIoCore(options)
  // We are re-using the io
  // one of the upside is even the server shutdown and re-start
  // the client will re-try until it reconnect, then we can
  // continue the operation
  if (config === false) {
    throw new Error('Mis-config master mind!')
  }
  const { namespace, client } = config[MASTER_MIND]
  const nsp = io.of(namespace)
  let result = await start()
  debug('started info', result)
  let started = true
  // start listening
  nsp.on('connection', socket => {
    debug('client connection')
    socket.on('status', (callback) => {
      callback(started)
    })
    socket.on('start', async (callback) => {
      if (!started) {
        result = await start()
        started = true
      }
      callback(result)
      logutil(`masterMind${' already'} start on `, result[2], result[0])
    })
    socket.on('stop', () => {
      if (started) {
        stop()
        started = false
        logutil('masterMind stopped')
      }
    })
    socket.on('restart', (callback) => {
      if (started) {
        stop()
      }
      // just pause a bit
      setTimeout(async () => {
        result = await start()
        started = true
        callback(result)
        logutil('masterMind restarted', result[2], result[0])
      }, 100)
    })
  })
  const url = `http://localhost:${result[0]}`
  const clientConfig = [`${url}${namespace}`, { path: config.socket.path, transports: TRANSPORT }]
  debug(clientConfig)
  // if client is false then just return info to construct the client themselves
  return client
    ? Reflect.apply(WSClient, null, clientConfig)
    : clientConfig
}
