// create a proxy here to see what is the problem with our public proxy
import test from 'ava'
// import request from 'superkoa'
import http from 'node:http'
import fetch from 'node-fetch'
import httpProxy from 'http-proxy'
import serverSetup from './fixtures/server-setup.mjs'
import { getDebug } from '../src/utils/index.mjs'
const debug = getDebug('test:proxy-dev')

const port = 6001
const proxyPort = 7001
// wrap in a function
async function createProxy (target) {
  const proxy = httpProxy.createProxyServer({})
  return new Promise(resolve => {
    http.createServer(function (req, res) {
      proxy.web(req, res, { target })
    }).listen(proxyPort, () => {
      resolve(proxyPort)
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
})

test.after((t) => {
  t.context.stop()
})

test('We should able to call the internal server directly', async t => {
  const res = await fetch(t.context.internalServerAddr)

  t.is(200, res.status)
})

test('We should able to create a proxy and connect to the internal server behind it', async t => {
  await createProxy(t.context.internalServerAddr)

  const res = await fetch(`http://localhost:${proxyPort}`)

  t.is(200, res.status)
})
