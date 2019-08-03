// Create a phoney socket server
const http = require('http');

const options = require('./options.json');

const debug = require('debug')('server-io-core:fixtures:proxy');

const Koa = require('koa');
const KoaSocket = require('koa-socket-2');
const app = new Koa();
const io = new KoaSocket();

// Reuse for proxy for the http
app.use(async (ctx, next) => {
  await next();
  ctx.body = options.message.banner;
});

io.attach(app);
// Use the raw socket instead
app._io.on('connection', sock => {
  debug('socket connection established');
  sock.emit('news', 'Hello world!');
  sock.on('message', (msg, fn) => {
    debug('client sent data to message endpoint', msg);
    fn(options.message.reply);
  });
});

const { port } = options.proxy;

const webserver = http.createServer(app.callback(), () => {
  debug('proxied server started on', port);
});

module.exports = (p = null) => {
  debug(p || port);
  webserver.listen(p || port);
  return {
    webserver,
    proxyApp: app
  };
};
