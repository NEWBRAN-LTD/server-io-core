// One more try with socket.io with http-proxy
import test from 'ava'
import http from 'node:http'
import HttpProxy from 'http-proxy'
import fetch from 'node-fetch'
import { WSServer, WSClient } from '../src/lib/socket-io.mjs'

const host = 'http://localhost:'
const port0 = 4001
const port1 = 4002
const hello = 'Hello there!'
test.before((t) => {
  t.context.proxyServer = new HttpProxy({ target: `${host}${port1}`, ws: true })
  t.context.server = http.createServer((req, res) => {
    res.end('hello')
  }).on('upgrade', (req, socket, head) => {
    t.context.proxyServer.ws(req, socket, head)
  }).listen(port0, () => {
    // console.log('front server started on', port0)
  })
  // standalone socket-io server
  t.context.wss = new WSServer(port1)
  t.context.wss.on('connection', socket => {
    socket.emit('msg', hello)
  })
})

test.after((t) => {
  t.context.server.close()
  t.context.wss.close()
})

test(`should able to talk to the front server @ ${port0}`, async t => {
  const res = await fetch(`${host}${port0}`)
  t.is(res.status, 200)
  const text = await res.text()
  t.is(text, 'hello')
})

test(`Should able to connect to the socket server @ ${port1} directly`, async t => {
  return new Promise(resolve => {
    const ws = WSClient(`${host}${port1}`)
    ws.on('connect', () => {
      ws.on('msg', msg => {
        t.is(msg, hello)
        resolve()
      })
    })
  })
})
// no luck the behind proxy for socket.io still fucked
test(`Should able to connect to the socket server from ${port0} `, async t => {
  return new Promise(resolve => {
    const ws = WSClient(`${host.replace('http', 'ws')}${port0}`)
    ws.on('connect', () => {
      ws.on('msg', msg => {
        t.is(msg, hello)
        resolve()
      })
    })
  })
})
