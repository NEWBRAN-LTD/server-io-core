// do this in a standalone way because the server requirement are different
const test = require('ava');
const socketClient = require('socket.io-client');
const socketIo = require('socket.io');
const http = require('http');
const serverIoCore = require('./fixtures/server');
const fs = require('fs');
const { join } = require('path');
const debug = require('debug')('server-io-core:proxy-test');

test.before(t => {
  // create a socket.io server
  const app = http.createServer(function(req, res) {
    fs.readFile(join(__dirname, 'fixtures', 'demo', 'dist', 'base', 'dummy.html'),
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading dummy.html');
      }
      res.writeHead(200);
      res.end(data);
    });
  });
  const io = socketIo(app);
  io.on('connection', function(socket) {
    debug('got a connection on server');
    socket.emit('news', {hello: 'world'});
    socket.on('msg', function(data) {
      debug('Got a msg', data);
    })
  });
  app.listen(4444);
  t.context.app = app;
  // start the server and proxy over it
  const { stop } = serverIoCore({
    wsProxy: 'http://localhost:4444',
    open: false,
    port: 5555
  });
  t.context.stop = stop;
});

test.after(t => {
  t.context.app.close();
  t.context.stop();
});

test.cb("It should able proxy over the socket", t => {
  const client = socketClient('http://localhost:5555');
  t.plan(1);
  client.on('connect', function() {
    debug('socket server is connected');
    client.emit('msg', 'wtf');
    client.on('news', function(data) {
      t.is('world', data.hello);
      t.end();
    });
  });
});
