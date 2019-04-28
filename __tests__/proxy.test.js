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
      host: `http://localhost:${port}`,
      context: 'proxy'
    }]
  });
  t.context.app = app;
  t.context.stop = stop;
});

test.after(t => {
  t.context.stop();
  t.context.proxy.close();
});

test(`It should able to connect to another proxy on ${port}`, async (t) => {

  try {
    const res = await request(t.context.app).get('/proxy');
    t.is(options.message.banner, res.text);
  } catch (e) {
    debug('wtf', e);
  }

});

test.todo('proxy socket test');


  /* koa-nginx throw error */
  /*
  const ioClient = client(server.defaultUrl);

  ioClient.emit('message', options.message.send, reply => {
    t.is(options.message.reply, reply);
  });
  */