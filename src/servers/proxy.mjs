/*
This will be the front that facing the public
Then we proxy the connection to the service behind it,
This server will get call last in the stack - waiting for other service started first
*/
import httpProxyLib from 'http-proxy'
import http from 'node:http'
import url from 'node:url'
import getDebug from '../utils/debug.mjs'
// Vars
const debug = getDebug('servers:proxy')

// Main - async is not right too, this should return an observable
export default async function createProxyServer (config) {
  // @NOTE the config is already clear by the time it gets here


  // this is not right yet, we should run through the config
  // to see how many things we need to proxy first
  const httpProxy = httpProxyLib.createProxyServer({})
  const socketProxy = httpProxyLib.createProxyServer({
    target: {
      host: 'localhost',
      port: websocketDestPort
    }
  })
  /*
    // for each proxy needs to have their own error handler
    httpProxy.on('error', e => {
      // handle the error
    })
  */
  // now construct the public facing server
  const publicFacingServer = http
    .createServer((req, res) => {
      const { pathname } = url.parse(req.url)
      debug(`calling pathname: ${pathname}`)
      httpProxy.web(req, res, {
        target: `http://localhost:${port}`
      })
    })
    .listen(publicPortNum, () => {
      // random bind a port
      if (publicPortNum === 0) {
        const p = publicFacingServer.address().port
        // @TODO let the outside know the port number
      }
    })

  // proxy to the websocket
  publicFacingServer.on('upgrade', (req, socket, head) => {
    const urlObj = url.parse(req.url)
    debug(`handle the upgrade event`, urlObj)
    debug('head', head.toString())
    // just pass them on
    socketProxy.ws(req, socket, head)
  })

  // add this point we should return a stop function


}
