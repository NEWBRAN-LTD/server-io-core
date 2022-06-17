// This one will only test the proxy web
const test = require('ava');
// Const http = require('http');
const options = require('./fixtures/options.json');
const server = require('./fixtures/server');
const proxyServer = require('./fixtures/proxy');
const port = options.proxy.port;
const debug = require('debug')('server-io-core:proxy-test');
const request = require('superkoa');

test.before(async t => {
  // Start the server behind proxy
  const { webserver } = proxyServer();
  t.context.proxyServer = webserver;
  // Start another server
  const { app, stop } = server({
    proxies: [
      {
        host: `http://localhost:${port}`,
        context: 'proxy'
      }
    ],
    open: false,
    reload: false
  });
  t.context.app = app;
  t.context.stop = stop;
});

test.after(t => {
  t.context.stop();
  t.context.proxyServer.close();
});

test(`It should able to connect to another proxy on ${port}`, async t => {
  try {
    const res = await request(t.context.app).get('/proxy');
    t.is(options.message.banner, res.text);
  } catch (e) {
    debug('wtf', e);
  }
});
