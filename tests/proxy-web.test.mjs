// testing the proxy webserver
import test from 'ava'
import fsx from 'fs-extra'
import { join } from 'node:path'
// import request from 'superkoa'
import fetch from 'node-fetch'
import { WSClient } from '../src/lib/socket-io.mjs'
import serverSetup from './fixtures/server-setup.mjs'
import koaWithSocketIo from './fixtures/dest-server-with-socket.mjs'
import { getDirname } from '../src/utils/index.mjs'
// vars
// const debug = getDebug('test:proxy-web')
const __dirname = getDirname(import.meta.url)
const options = fsx.readJsonSync(join(__dirname, 'fixtures', 'options.json'))
const port0 = 10001
const port = 10002

test.before(async (t) => {
  const { webserver } = koaWithSocketIo(port0)
  t.context.proxyServer = webserver
  const { app, stop } = await serverSetup({
    port,
    proxies: [
      {
        type: 'http',
        context: 'proxy',
        target: `http://localhost:${port0}`
      },
      {
        type: 'ws',
        context: 'socket',
        target: `http://localhost:${port0}`
      }
    ]
  })
  t.context.app = app
  t.context.stop = stop
})

test.after(t => {
  t.context.stop()
  t.context.proxyServer.close()
})

test(`It should able to connect to server on ${port0}`, async t => {
  const res = await fetch(`http://localhost:${port0}`)
  const text = await res.text()
  t.is(options.message.banner, text)
})

test(`It should able to connect to server from ${port} proxy to ${port0}`, async t => {
  const res = await fetch(`http://localhost:${port}/proxy`)
  const text = await res.text()
  t.is(options.message.banner, text)
})

test(`Should able to connect to socket server via ${port0}`, async t => {
  return new Promise(resolve => {
    const client = WSClient(`ws://localhost:${port0}`)
    client.on('connect', () => {
      client.on('news', news => {
        t.is(news, 'Hello world!')
        resolve()
      })
    })
  })
})
