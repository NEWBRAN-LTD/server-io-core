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
  debug('connection established');
  sock.emit('news', 'Hello world!');
  sock.on('message', (msg, fn) => {
    debug('client sent data to message endpoint', msg);
    fn(options.message.reply);
  });
});
/*
Const handler = function(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('request successfully proxied!' + '\n' + JSON.stringify(req.headers, true, 2));
  res.end();
}
*/
const { port } = options.proxy;
debug(port);
const webserver = http.createServer(app.callback(), () => {
  debug('proxied server started on', port);
});

module.exports = () => {
  webserver.listen(port);
  return {
    webserver,
    proxyApp: app
  };
};
