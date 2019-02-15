const test = require('ava');
const client = require('socket.io-client');
const http = require('http');
const options = require('./fixtures/options.json');
const server = require('./fixtures/server');
const proxy = require('./fixtures/proxy');
const port = options.proxy.port;
const debug = require('debug')('server-io-core:proxy-test');
const request = require('superkoa');

test.before(async t => {
  // start the server behind proxy
  t.context.proxy = proxy();
  // start another server
  const { app, stop, io } = server({
    proxies: [{
      target: `http://localhost:${port}`,
      context: '/proxy'
    },{
      target: `http://localhost:${port}`,
      ws: true
    }]
  });
  t.context.app = app;
  t.context.stop = stop;
});

test.after(t => {
  t.context.stop();
  t.context.proxy.exit();
});

test(`It should able to connect to another proxy on ${port}`, async (t) => {

  try {
    const data = await request(t.context.app).get('/proxy');
    // const data = await getViaProxy([options.defaultUrl, 'proxy'].join('/'));

    t.is(options.message.banner, data);
  } catch (e) {
    debug('wtf', e);
  }

  /* koa-nginx throw error */
  /*
  const ioClient = client(server.defaultUrl);

  ioClient.emit('message', options.message.send, reply => {
    t.is(options.message.reply, reply);
  });
  */
});

test.todo('proxy socket test');
