// create a phoney socket server
const Koa = require('koa');
const IO = require('koa-socket-2');
const options = require('./options.json');

const app = new Koa();
const io = new IO();
// reuse for proxy for the http
app.use(async (ctx, next) => {
  ctx.body = 'Hello world!';
});

io.attach(app);

io.on('message', (ctx, data) => {
  console.log('client sent data to message endpoint', data);
});

app.listen( options.proxy.port );
