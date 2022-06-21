// testing the proxy webserver
import test from 'ava'
import fsx from 'fs-extra'
import { join } from 'node:path'
import request from 'superkoa'
import serverSetup from './fixtures/server-setup.mjs'
import koaWithSocketIo from './fixtures/dest-server-with-socket.mjs'
import { getDebug, getDirname } from '../src/utils/index.mjs'
// vars
const debug = getDebug('test:proxy-web')
const __dirname = getDirname(import.meta.url)
const options = fsx.readJsonSync(join(__dirname, 'fixtures', 'options.json'))
const port = options.proxy.port

test.before(async (t) => {
  const {
    webserver,
    port0,
    proxyApp
  } = koaWithSocketIo()
  t.context.port0 = port0
  t.context.proxyApp = proxyApp
  t.context.proxyServer = webserver
  const { app, stop } = await serverSetup({
    proxies: [
      {
        type: 'http',
        context: 'proxy',
        target: `http://localhost:${port}`
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

test(`It should able to connect to another proxy on ${port}`, async t => {
  try {
    const res = await request(t.context.app).get('/proxy')
    t.is(options.message.banner, res.text)
  } catch (e) {
    debug('wtf', e)
  }
})
