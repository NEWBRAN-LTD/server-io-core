// Do this in a standalone way because the server requirement are different
const test = require('ava');
const socketClient = require('socket.io-client');
const request = require('superkoa')
const serverIoCore = require('../proxy');

const debug = require('debug')('server-io-core:proxy-test');

const proxyServer = require('./fixtures/proxy');
const namespace = 'behind-the-proxy';

const frontPort = 8000;
const proxyPort = 9001;

// develop here

const http = require('http')
const httpProxy = require('http-proxy')
const url = require('url')


test.before(t => {
  t.context.proxyServer = proxyServer(proxyPort);

  const proxy = httpProxy.createProxyServer({});

  proxy.on('error', function(e) {
    debug(`Proxy error:`, e)
  })

  t.context.server = http.createServer(function(req, res) {
    const { pathname } = url.parse(req.url);
    debug(`pathname: ${pathname}`)
    proxy.web(req, res, { target: `http://localhost:${proxyPort}` });
  }).listen(frontPort, () => {
    debug(`proxy server started on ${frontPort}`)
  })

  /*
  const { app, stop } = serverIoCore({
    open: false,
    debugger: true,
    reload: true,
    proxies: [
      {
        target: ['ws://localhost', proxyPort].join(':'),
        context: namespace,
        ws: true
      },
      {
        target: ['http://localhost', proxyPort].join(':'),
        context: 'test'
      }
    ]
  });
  t.context.app = app;
  t.context.stop = stop;
  */
});

test.after(t => {
  t.context.proxyServer.close();
  // t.context.stop();
});

test.cb(`Connect to the socket server directly on ${proxyPort}`, t => {
  const client = socketClient(`ws://localhost:${proxyPort}`);
  t.plan(1);
  client.on('connect', () => {
    debug('connected');
    client.on('news', msg => {
      debug('news msg', msg);
      t.pass();
      t.end();
    });
  });
});

test(`Connect to the http via the proxy server on ${frontPort}`, async t => {
  const res = await request(t.context.app).get('/test')

  debug(res.body)
  t.is(res.status, 200)
})
