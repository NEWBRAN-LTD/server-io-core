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
  standaloneServer,
  frontPort,
  proxyConfig
} = require('./fixtures/socket');
const namespace = 'behind-the-proxy';

test.before(t => {
  const proxyPort = proxyConfig.target.port;
  const { stop } = serverIoCore({
    open: false,
    wsProxy: {
      enable: true,
      target: {
        namespace: namespace,
        host: ['http://localhost', proxyPort].join(':'),
        events: ['msg', 'reply']
      }
    },
    port: frontPort
  });
  t.context.stop = stop;
});

test.after(t => {
  setTimeout(function() {
    debug('execute after call');
    t.context.stop();
    standaloneServer.close();
  }, 10*1000);
});

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
