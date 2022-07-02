// this is a pupeteer to control the serverIoCore server start restart etc
// the reason is we could use this to work with Cypress (or other test framework)
// to control this dev server
import { MASTER_MIND, AUTO_START } from './src/lib/constants.mjs'
import { WSClient } from './src/lib/socket-io.mjs'
import { logutil } from './src/utils/index.mjs'
import serverIoCorePublic from './index.mjs'
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
  } = await serverIoCorePublic(options)
  // We are re-using the io
  // one of the upside is even the server shutdown and re-start
  // the client will re-try until it reconnect, then we can
  // continue the operation
  if (config === false) {
    throw new Error('Mis-config master mind!')
  }
  const { namespace } = config[MASTER_MIND]
  const nsp = io.of(namespace)
  let result
  // start listening
  nsp.on('connection', socket => {
    socket.on('start', async (_, callback) => {
      result = await start()
      callback(result)
      logutil('masterMind start on ', result.address, result.port)
    })
    socket.on('stop', () => {
      stop()
      logutil('masterMind stopped')
    })
    socket.on('restart', (_, callback) => {
      stop()
      // just pause a bit
      setTimeout(async () => {
        await start()
        callback(result)
        logutil('masterMind restarted', result.address, result.port)
      }, 100)
    })
  })
  // create a client and return it
  const client = WSClient(namespace, { path: config.socket.path })
  console.log(namespace, config.socket.path)
  return client
}
