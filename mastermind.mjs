// this is a pupeteer to control the serverIoCore server start restart etc
// the reason is we could use this to work with Cypress (or other test framework)
// to control this dev server
import { MASTER_MIND } from './src/lib/constants.mjs'
import { WSClient } from './src/lib/socket-io.mjs'
import { logutil } from './src/utils'
import serverIoCorePublic from './index.mjs'
// main
export async function masterMind (options = {}) {
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
  // also create a client and return it
  const client = WSClient(namespace, { path: config.socket.path })
  let result
  // start listening
  nsp.on('connection', socket => {
    socket.on('start', async () => {
      result = await start()
      logutil('Master minded server start on ', result.address, result.port)
    })
    socket.on('stop', () => {
      stop()
      logutil('Master minded server stopped')
    })
    socket.on('restart', () => {
      stop()
      // just pause a bit
      setTimeout(async () => {
        await start()
        logutil('Master mind server restarted', result.address, result.port)
      }, 100)
    })
  })

  return client
}
