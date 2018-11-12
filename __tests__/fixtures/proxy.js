// create a phoney socket server
const Koa = require('koa');
const IO = require('koa-socket-2');
const options = require('./options.json');
const app = new Koa();
const io = new IO();
// reuse for proxy for the http
app.use(async (ctx, next) => {
  ctx.body = options.message.banner;
});

io.attach(app);
// use the raw socket instead
app._io.on('connection', sock => {
  console.log('connection established');
  sock.on('message', (msg, fn) => {
    console.log('client sent data to message endpoint', data);
    fn(options.message.reply);
  });
});

/*
io.on('message', (ctx, data, fn) => {
  console.log('client sent data to message endpoint', data);
  // not sure if they send back the fn
  fn(options.message.reply);
});
*/

module.exports = function() {
  app.listen( options.proxy.port );
  return app;
}
