// Create a phoney socket server
const http = require('http')
const socketIo = require('socket.io')
const options = require('./options.json')

const debug = require('debug')('server-io-core:fixtures:proxy')

const Koa = require('koa')

const app = new Koa()
// Reuse for proxy for the http
app.use(async (ctx, next) => {
  await next();
  ctx.body = options.message.banner
})

const { port } = options.proxy

const webserver = http.createServer(app.callback(), () => {
  debug('proxied server started on', port)
})

const io = socketIo(webserver)

io.on('connection', socket => {
  // Fucking on of undefined?
  socket.on('msg', (data, fn) => {
    debug('message', data)
    fn(`I got your message`)
  })

  socket.emit('news', 'Hello world!')
})

const nsp = io.of(`some-namespace`)

nsp.on('connection', socket => {
  debug(`nsp some-namespace connected`)
  socket.emit(`news`, 'this one is from nsp')
})

module.exports = (p = null) => {
  debug(p || port);
  webserver.listen(p || port)
  return {
    webserver,
    proxyApp: app
  }
}
