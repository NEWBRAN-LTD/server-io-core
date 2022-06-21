// create a proxy here to see what is the problem with our public proxy
import test from 'ava'
// import request from 'superkoa'
import http from 'node:http'
import url from 'node:url'
import fetch from 'node-fetch'
import HttpProxy from 'http-proxy'
import { WSClient } from '../src/lib/socket-io.mjs'
import serverSetup from './fixtures/server-setup.mjs'
import koaWithSocketIo from './fixtures/dest-server-with-socket.mjs'
import { getDebug } from '../src/utils/index.mjs'
import WebSocket, { WebSocketServer } from 'ws'
const debug = getDebug('test:proxy-dev')

const port = 6001
const proxyPort = 7001
const proxyPort1 = 7002
const port0 = 8999
// wrap in a function
async function createProxy (target) {
  const proxy = new HttpProxy({ target })
  const dummy1 = new HttpProxy({ target: `http://localhost:${proxyPort1}` })
  const dummy2 = new HttpProxy({ target: `http://localhost:${port0}`, ws: true })
  const dummy3 = new HttpProxy({ target: 'http://localhost:8080', ws: true })

  return new Promise(resolve => {
    const srv = http.createServer(function (req, res) {
      const { pathname } = url.parse(req.url)
      debug(`calling pathname: ${pathname}`)
      if (pathname === '/dummy') {
        debug('proxy to dummy')
        return dummy1.web(req, res)
      } else if (pathname === '/dest') {
        return dummy2.web(req, res)
      }
      proxy.web(req, res)
    }).on('upgrade', (req, socket, head) => {
      const { pathname } = url.parse(req.url)
      // console.log(`calling pathname: ${pathname}`)
      // console.log('hear the socket connection', head)
      if (pathname === '/whatever') {
        return dummy3.ws(req, socket, head)
      }
      // console.log('fall back to dummy2')
      dummy2.ws(req, socket, head)
    }).listen(proxyPort, () => {
      resolve(srv)
    })
  })
}

test.before(async (t) => {
  // create yet another ws server
  const wss = new WebSocketServer({ port: 8080 })
  wss.on('connection', function connection (ws) {
    ws.on('message', data => {
      // console.log('hear the client', data.toString())
    })
  })
  // this is with socket.io
  const { webserver } = koaWithSocketIo()
  t.context.destServer = webserver

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
  t.context.destServer.close()
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

test('Should able to connect to more proxied server', async t => {
  const res1 = await fetch(`http://localhost:${proxyPort}/dest`)
  t.is(200, res1.status)
  const msg = await res1.text()
  t.is('This is server-io-core', msg)
})

test('should also able to connect to a socket.io server', async t => {
  return new Promise(resolve => {
    const client = WSClient(`ws://localhost:${proxyPort}/some-namespace`)
    client.on('connect', () => {
      client.on('news', msg => {
        t.truthy(msg)
        // end
        resolve(true)
      })
    })
  })
})

test('should able to connect to wss via proxy as well', async t => {
  const client = new WebSocket(`ws://localhost:${proxyPort}/whatever`)
  return new Promise(resolve => {
    client.on('open', () => {
      client.send('Hello!')
      t.pass()
      resolve()
    })
  })
})
