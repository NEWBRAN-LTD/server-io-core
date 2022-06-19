/*
This will be the front that facing the public
Then we proxy the connection to the service behind it,
This server will get call last in the stack - waiting for other service started first
*/
import httpProxyLib from 'http-proxy'
import http from 'node:http'
import url from 'node:url'
import getDebug from '../utils/debug.mjs'
import { DEFAULT_KEY, INTERNAL_PORT, DEFAULT_HOST } from '../lib/constants.mjs'
// Vars
const debug = getDebug('servers:proxy')
// Main - async is not right too, this should return an observable
export default async function createPublicProxyServer (config) {
  // @NOTE the config is already clear by the time it gets here
  // this is not right yet, we should run through the config
  // to see how many things we need to proxy first
  const publicPortNum = config.port
  const hostname = Array.isArray(config.host) ? config.host[0] : config.host
  const internalPort = config[INTERNAL_PORT]
  const httpProxies = {}
  const wsProxies = {}
  // these proxy to our internal servers
  const httpProxy = httpProxyLib.createProxyServer({})
  if (config.socketIsEnabled) {
    // this ws proxy point back to our own internal socket server
    wsProxies[DEFAULT_KEY] = httpProxyLib.createProxyServer({
      target: {
        host: DEFAULT_HOST,
        port: internalPort
      }
    })
  }
  // prepare the routes
  if (config.proxies.length) {
    config.proxies.forEach(proxyConfig => {
      debug('proxyConfig', proxyConfig)
      const { type } = proxyConfig
      if (type === 'http') {
        const { from, target } = proxyConfig
        if (from && target) {
          httpProxies[from] = [
            target,
            httpProxyLib.createProxyServer({})
          ]
        } else {
          debug('mis-config http proxy', proxyConfig)
        }
      } else if (type === 'ws') {
        const { from, host, port } = proxyConfig
        if (host && port) {
          wsProxies[from] = httpProxyLib.createProxyServer({
            target: { host, port }
          })
        } else {
          debug('mis-config ws proxy', proxyConfig)
        }
      } else {
        debug('unknown proxy config', config)
      }
    })
  }
  // now construct the public facing server
  const publicFacingServer = http
    .createServer((req, res) => {
      const { pathname } = url.parse(req.url)
      debug(`calling pathname: ${pathname}`)
      // first we search for route that match
      if (httpProxies[pathname]) {
        debug('found proxy for ', pathname)
        const [target, proxy] = httpProxies[pathname]
        proxy.web(req, res, { target })
      } else {
        const internalHost = `http://${DEFAULT_HOST}:${internalPort}`
        debug('fallback to ', internalHost)
        httpProxy.web(req, res, {
          target: internalHost
        })
      }
    })
    // proxy to the websocket
    .on('upgrade', (req, socket, head) => {
      const urlObj = url.parse(req.url)
      debug('handle the upgrade event', urlObj)
      debug('head', head.toString())
      const { pathname } = urlObj
      if (wsProxies[pathname]) {
        wsProxies[pathname].ws(req, socket, head)
      } else if (wsProxies[DEFAULT_KEY]) {
        // just pass them on
        wsProxies[DEFAULT_KEY].ws(req, socket, head)
      }
    })
  // add this point we should return a start, stop function
  return {
    async startPublic () {
      return new Promise((resolve) => {
        publicFacingServer.listen(publicPortNum, hostname, () => {
          // random bind a port
          if (publicPortNum === 0) {
            const port = publicFacingServer.address().port
            debug('proxy server started on dynamic port:', port)
            // @TODO let the outside know the port number
            return resolve(port)
          }
          debug('proxy server started on port:', publicPortNum)
          resolve(publicPortNum)
        })
      })
    },
    stopPublic () {
      publicFacingServer.close()
    }
  }
}
