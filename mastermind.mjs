// this is a pupeteer to control the serverIoCore server start restart etc
// the reason is we could use this to work with Cypress (or other test framework)
// to control this dev server
import serverIoCorePublic from './index.mjs'
import { io as socketClient } from 'socket.io-client'
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
  const { namespace } = config
  const nsp = io.of(namespace)
  // also create a client and return it
  const client = socketClient()
  let port // store the port for restart
  // start listening
  nsp.on('connection', socket => {
    socket.on('start', () => {
      start()
    })
    socket.on('stop', () => {
      stop()
    })
    socket.on('restart', () => {
      stop()
      // just pause a bit
      setTimeout(() => {
        start()
      }, 100)
    })
  })

  return client
}
