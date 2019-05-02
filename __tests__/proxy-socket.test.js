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
  frontServer,
  standAlone,
  frontPort,
  proxyConfig
} = require('./fixtures/socket');

test.before(t => {
  const { stop } = serverIoCore({
    open: false,
    wsProxy: proxyConfig,
    port: frontPort
  });
  t.context.stop = stop;
});

test.after(t => {

  t.context.stop();
  standaloneServer.close();

});

test.skip("It should able proxy over the socket", t => {
  const client = socketClient(`http://localhost:${frontPort}`);
  t.plan(1);
  client.on('connect', function() {
    debug('socket server is connected');

    client.on('msg', function(data) {
      debug('got a msg', data);
      client.emit('reply', 'Just say hi back!');
      t.is('world', data.hello);
      t.end();
    });
  });
});
