/*
This will be the front that facing the public
Then we proxy the connection to the service behind it,
This server will get call last in the stack - waiting for other service started first
*/
import http from 'node:http'
// import url from 'node:url'
import HttpProxy from 'http-proxy'
import { INTERNAL_PORT, DEFAULT_HOST } from '../lib/constants.mjs'

// Main - async is not right too, this should return an observable
export default async function createPublicProxyServer (config) {
  // prepare
  const publicPort = config.port
  const publicHost = Array.isArray(config.host) ? config.host[0] : config.host
  const internalPort = config[INTERNAL_PORT]
  const internalHost = `http://${DEFAULT_HOST}:${internalPort}`
  // proxy to internal
  const proxy = new HttpProxy({ target: internalHost, ws: true })
  console.log('proxy point to ', internalHost)
  // create public server
  const publicServer = http.createServer((req, res) => {
    proxy.web(req, res)
  }).on('upgrade', (req, socket, head) => {
    proxy.ws(req, socket, head)
  })

  return {
    startPublic: async () => {
      return new Promise(resolve => {
        publicServer.listen(
          publicPort,
          publicHost,
          () => {
            const info = publicServer.address()
            console.log('publicServer', info)
            resolve(publicServer.address())
          }
        )
      })
    },
    stopPublic: () => {
      publicServer.close()
    }
  }
}
/*

// breaking up
function prepareProxiesConfig (config) {
  const httpProxies = {}
  const wsProxies = {}
  config.proxies.forEach(proxyConfig => {
    debug('proxyConfig', proxyConfig)
    const { type } = proxyConfig
    if (type === 'http') {
      const { context, target } = proxyConfig
      if (context && target) {
        httpProxies[context] = [
          target,
          httpProxyLib.createProxyServer({})
        ]
      } else {
        debug('mis-config http proxy', proxyConfig)
      }
    } else if (type === 'ws') {
      const { context, target } = proxyConfig
      if (context && target) {
        wsProxies[context] = httpProxyLib.createProxyServer({
          target: target
        })
      } else {
        debug('mis-config ws proxy', proxyConfig)
      }
    } else {
      debug('unknown proxy config', config)
    }
  })
  return { httpProxies, wsProxies }
}

export default async function createPublicProxyServer (config) {
  // @NOTE the config is already clear by the time it gets here
  // this is not right yet, we should run through the config
  // to see how many things we need to proxy first
  const publicPortNum = config.port
  const hostname = Array.isArray(config.host) ? config.host[0] : config.host
  const internalPort = config[INTERNAL_PORT]
  const internalHost = `http://${DEFAULT_HOST}:${internalPort}`
  debug('internalHost', internalHost)
  // create proxies
  const defaultProxy = httpProxyLib.createProxyServer({ target: internalHost })
  const { httpProxies, wsProxies } = prepareProxiesConfig(config)
  // now construct the public facing server
  const publicFacingServer = http.createServer(function (req, res) {
    const { pathname } = url.parse(req.url)
    debug(`calling pathname: ${pathname}`)
    // first we search for route that match
    if (httpProxies[pathname]) {
      const [target, proxy] = httpProxies[pathname]
      debug('found proxy for ', pathname, 'to', target)
      return proxy.web(req, res, { target }, e => {
        debug('custom proxy', target, 'error:', e)
      })
    }
    defaultProxy.web(req, res, { target: internalHost }, e => {
      debug('internal proxy error', e)
    })
  }).on('upgrade', (req, socket, head) => {
    const { pathname } = url.parse(req.url)
    debug('head', pathname, head.toString())
    if (wsProxies[pathname]) {
      return wsProxies[pathname].ws(req, socket, head)
    }
    // just pass them on
    defaultProxy.ws(req, socket, head)
  }).on('error', err => {
    debug('publicProxyServer error', err)
  })
  // add this point we should return a start, stop function
  return {
    async startPublic () {
      return new Promise((resolve) => {
        publicFacingServer.listen(publicPortNum, hostname, () => {
          // random bind a port
          if (publicPortNum === 0) {
            const port = publicFacingServer.address().port
            // @TODO let the outside know the port number
            debug('proxy started on ', hostname, port)
            return resolve({ hostname, port })
          }
          debug('proxy stared on ', hostname, publicPortNum)
          resolve({ hostname, port: publicPortNum })
        })
      })
    },
    stopPublic () {
      publicFacingServer.close()
    }
  }
}
*/
