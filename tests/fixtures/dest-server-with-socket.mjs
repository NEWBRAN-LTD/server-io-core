// test server to get proxied
import http from 'node:http'
import { join } from 'node:path'
import { Server } from 'socket.io'
import fsx from 'fs-extra'
import Koa from 'koa'
import { getDebug, getDirname } from '../../src/utils/index.mjs'
// vars
const __dirname = getDirname(import.meta.url)
const options = fsx.readJsonSync(join(__dirname, 'options.json'))
const debug = getDebug('fixtures:proxy')
const app = new Koa()
app.use(async (ctx, next) => {
  await next()
  ctx.body = options.message.banner
})
const port = options.proxy
const webserver = http.createServer(
  app.callback(),
  () => {
    debug('dest server started on', port)
  }
)
const io = new Server(webserver, {
  cors: {
    origin: `http://localhost:${port}`
  }
})

io.on('connection', socket => {
  socket.on('msg', (data, fn) => {
    debug('message', data)
    fn('I got your message')
  })
  socket.emit('news', 'Hello world!')
})

const nsp = io.of('some-namespace')

nsp.on('connection', socket => {
  debug('nsp some-namespace connected')
  socket.emit('news', 'This one is from nsp')
})
// export
export default function koaWithSocketIo (p = null) {
  const _port = p || port
  debug(_port)
  webserver.listen(_port, () => {
    // console.log('koaWithSocketIo', _port)
  })
  return {
    webserver,
    port0: _port,
    proxyApp: app
  }
}
