// do this in a standalone way because the server requirement are different
const test = require('ava');
const socketClient = require('socket.io-client');
const socketIo = require('socket.io');
const http = require('http');
const serverIoCore = require('./fixtures/server');
const fs = require('fs');
const { join } = require('path');
const debug = require('debug')('server-io-core:proxy-test');
const {
  // frontServer,
  // standaloneServer,
  frontPort,
  proxyConfig
} = require('./fixtures/socket');
const proxyServer = require('./fixtures/proxy');
const namespace = 'behind-the-proxy';
const proxyPort = 9001

test.before(t => {

  t.context.proxyServer = proxyServer(proxyPort)

  const { stop } = serverIoCore({
    debugger: true,
    reload: true,
    wsProxies: {
      target: ['ws://localhost', proxyPort].join(':'),
      namespace: namespace
    },
    port: frontPort
  });
  t.context.stop = stop;
});

test.after(t => {
  setTimeout(function() {
    debug('execute after call');
    t.context.proxyServer.close()
    t.context.stop();
    // standaloneServer.close();
  }, 1000);
});

test.cb(`Connect to the socket server directly on ${proxyPort}`, t => {
  const client = socketClient(`ws://localhost:${proxyPort}`)
  t.plan(1)
  client.on('connect', (socket) => {
    debug('connected')
    socket.on('news', msg => {
      debug('news msg', msg)
      t.pass()
      t.end()
    })
  })
})


test.cb.skip(`It should able to connect to the socket server via ${namespace} on ${proxyPort}`, t => {
  const client = socketClient(`http://localhost:${frontPort}/${namespace}`);
  t.plan(1);
  client.on('connect', function() {
    t.pass()
    t.end()
  })
})


/*
test.cb("server-io-core should able proxy over the socket", t => {
  const client = socketClient(`http://localhost:${frontPort}/${namespace}`);
  t.plan(1);
  client.on('connect', function() {
    debug('socket server is connected');
    // t.pass();
    // t.end();
    client.on('msg', function(data) {
      debug('got a msg', data);
      client.emit('reply', 'Just say hi back!');
      t.is('world', data.hello);
      t.end();
    });
  });
});
*/
