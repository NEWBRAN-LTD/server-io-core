// Do this in a standalone way because the server requirement are different
const test = require('ava');
const socketClient = require('socket.io-client');

const serverIoCore = require('../proxy');

const debug = require('debug')('server-io-core:proxy-test');

const proxyServer = require('./fixtures/proxy');
const namespace = 'behind-the-proxy';

const frontPort = 8000;
const proxyPort = 9001;

test.before(t => {
  t.context.proxyServer = proxyServer(proxyPort);

  const { stop } = serverIoCore({
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
  t.context.stop = stop;
});

test.after(t => {
  setTimeout(function() {
    debug('execute after call');
    t.context.proxyServer.close();
    t.context.stop();
  }, 1000);
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
