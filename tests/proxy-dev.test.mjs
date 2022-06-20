// create a proxy here to see what is the problem with our public proxy
import test from 'ava'
// import request from 'superkoa'
import http from 'node:http'
import url from 'node:url'
import fetch from 'node-fetch'
import httpProxy from 'http-proxy'
import serverSetup from './fixtures/server-setup.mjs'
import { getDebug } from '../src/utils/index.mjs'
const debug = getDebug('test:proxy-dev')

const port = 6001
const proxyPort = 7001
const proxyPort1 = 7002
// wrap in a function
async function createProxy (target) {
  const proxy = httpProxy.createProxyServer({})
  return new Promise(resolve => {
    const srv = http.createServer(function (req, res) {
      const { pathname } = url.parse(req.url)
      debug(`calling pathname: ${pathname}`)
      if (pathname === '/dummy') {
        debug('proxy to dummy')
        return proxy.web(req, res, { target: `http://localhost:${proxyPort1}` })
      }
      proxy.web(req, res, { target })
    }).listen(proxyPort, () => {
      resolve(srv)
    })
  })
}

test.before(async (t) => {
  const { app, start, stop } = await serverSetup({ port, autoStart: false })
  t.context.app = app
  t.context.stop = stop
  const info = await start()
  debug('start up info', info)
  t.context.info = info
  t.context.internalServerAddr = 'http://localhost:' + t.context.info[1]
  // setup proxy
  t.context.proxyServer = await createProxy(t.context.internalServerAddr)
  // setup a secondary dest
  t.context.dummyServer = http.createServer(function (req, res) {
    const { pathname } = url.parse(req.url)
    debug('dummy server got called', pathname)
    res.end(pathname)
  }).listen(proxyPort1)
})

test.after((t) => {
  t.context.stop()
  t.context.dummyServer.close()
  t.context.proxyServer.close()
})

test('We should able to call the internal server directly', async t => {
  const res = await fetch(t.context.internalServerAddr)
  t.is(200, res.status)
})

test('We should able to create a proxy and connect to the internal server behind it', async t => {
  const res1 = await fetch(`http://localhost:${proxyPort}`)
  t.is(200, res1.status)
  // try to request a file
  const res2 = await fetch(`http://localhost:${proxyPort}/default.html`)
  t.is(200, res2.status)
  // try to call dummy server via proxy
  const res3 = await fetch(`http://localhost:${proxyPort1}/dummy`)
  t.is(200, res3.status)
})
