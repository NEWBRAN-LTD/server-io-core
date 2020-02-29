// Do this in a standalone way because the server requirement are different
const test = require('ava');
const socketClient = require('socket.io-client');
const http = require('http');
const httpProxy = require('http-proxy');
const url = require('url');
// const serverIoCore = require('../proxy');

const debug = require('debug')('server-io-core:proxy-test');

const proxyServer = require('./fixtures/proxy');
// const namespace = 'behind-the-proxy';

const frontPort = 8000;
const proxyPort = 9001;

test.before(t => {
  let { webserver } = proxyServer(proxyPort);
  t.context.proxyServer = webserver;

  const proxy = httpProxy.createProxyServer({});
  const proxySocket = httpProxy.createProxyServer({
    target: {
      host: 'localhost',
      port: proxyPort
    }
  });
  proxy.on('error', function(e) {
    debug(`Proxy error:`, e);
  });

  const server = http
    .createServer(function(req, res) {
      const { pathname } = url.parse(req.url);
      debug(`pathname: ${pathname}`);
      proxy.web(req, res, { target: `http://localhost:${proxyPort}` });
    })
    .listen(frontPort, () => {
      debug(`proxy server started on ${frontPort}`);
    });

  server.on('upgrade', function(req, socket, head) {
    const obj = url.parse(req.url);
    debug(`hear the upgrade event via `, obj);
    // Debug(`socket`, socket)
    debug(`head`, head.toString());
    proxySocket.ws(req, socket, head);
  });

  t.context.server = server;

  /*
  Const { app, stop } = serverIoCore({
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
  t.context.server.close();
  // T.context.stop();
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

test.cb(`Connect to the http via the proxy server on ${frontPort}`, t => {
  t.plan(1);
  http.get(`http://localhost:${frontPort}/test`, (res) => {
    if (res.statusCode !== 200) {
      return debug(`request err`, res);
    }

    debug(res);
    t.is(res.statusCode, 200);
    t.end();
  });
});

test.cb(
  `It should able to connect to the socket server via the proxy port ${frontPort}`,
  t => {
    t.plan(1);
    const client = socketClient(`ws://localhost:${frontPort}/some-namespace`);
    client.on('connect', () => {
      debug(`connected on ${frontPort}`);
      client.on('news', msg => {
        t.truthy(msg);
        t.end();
      });
    });
  }
);
