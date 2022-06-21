/*
This will be the front that facing the public
Then we proxy the connection to the service behind it,
This server will get call last in the stack - waiting for other service started first
*/
import http from 'node:http'
import url from 'node:url'
import HttpProxy from 'http-proxy'
import { INTERNAL_PORT, DEFAULT_HOST } from '../lib/constants.mjs'
import { logutil, getDebug, objLength } from '../utils/index.mjs'
const debug = getDebug('publix-proxy-server')
// Main - async is not right too, this should return an observable
export default async function createPublicProxyServer (config) {
  // prepare
  const publicPort = config.port
  const publicHost = Array.isArray(config.host) ? config.host[0] : config.host
  const internalPort = config[INTERNAL_PORT]
  const internalHost = `http://${DEFAULT_HOST}:${internalPort}`
  // proxy to internal
  const proxy = new HttpProxy({ target: internalHost, ws: true })
  debug('proxy point to ', internalHost)
  // prepare the other proxies
  const { httpProxies, wsProxies } = prepareProxiesConfig(config)
  // create public server
  const publicServer = http.createServer((req, res) => {
    const { pathname } = url.parse(req.url)
    if (httpProxies[pathname]) {
      debug('http proxy catched', pathname)
      return httpProxies[pathname].web(req, res)
    }
    proxy.web(req, res)
  }).on('upgrade', (req, socket, head) => {
    const { pathname } = url.parse(req.url)
    debug('ws pathname', pathname)
    if (wsProxies[pathname]) {
      debug('ws proxy catched', pathname)
      return wsProxies[pathname].ws(req, socket, head)
    }
    proxy.ws(req, socket, head)
  })

  return {
    startPublic: async () => {
      return new Promise(resolve => {
        publicServer.listen(
          publicPort,
          publicHost,
          () => {
            const info = updateInfo(publicServer.address())
            const msg = `${info.hostname}:${info.port} --> ${internalHost}`
            debug('publicServer', info, msg)
            logutil(msg)
            resolve(info)
          }
        )
      })
    },
    stopPublic: () => {
      publicServer.close()
    }
  }
}

// just move the address to hostname
function updateInfo (info) {
  for (const key in info) {
    if (key === 'address') {
      info.hostname = info[key]
    }
  }
  return info
}

// prepare the user supplied proxies
function prepareProxiesConfig ({ proxies }) {
  const httpProxies = {}
  const wsProxies = {}
  proxies.forEach(proxyConfig => {
    debug('proxyConfig', proxyConfig)
    const { type } = proxyConfig
    if (type === 'http') {
      const { context, target } = proxyConfig
      if (context && target) {
        httpProxies[context] = new HttpProxy({ target })
      } else {
        debug('mis-config http proxy', proxyConfig)
      }
    } else if (type === 'ws') {
      const { context, target } = proxyConfig
      if (context && target) {
        wsProxies[context] = new HttpProxy({ target, ws: true })
      } else {
        debug('mis-config ws proxy', proxyConfig)
      }
    } else {
      debug('unknown proxy config', proxyConfig)
    }
  })
  debug('proxies http:', objLength(httpProxies), 'ws:', objLength(wsProxies))
  return { httpProxies, wsProxies }
}
