const httpProxy = require('http-proxy');
const socketIo = require('socket.io');
const http = require('http');
const fs = require('fs');
const { join } = require('path');
const { inspect } = require('util');
const debug = require('debug')('server-io-core:socket-setup');
// init
const server = http.createServer(handler);
const io = socketIo(server);

server.listen(9015);

function handler(req, res) {
  fs.readFile(join(__dirname, '..', 'proxy', 'index.html'),
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }
      res.writeHead(200);
      res.end(data);
    }
  );
}

io.on('connection', function(socket) {
  socket.emit('msg', {hello: 'world'});
  socket.on('reply', function(data) {
    debug('receive reply: ', data);
  });
});

//
// Setup our server to proxy standard HTTP requests
//
var proxy = new httpProxy.createProxyServer({
  target: {
    host: 'localhost',
    port: 9015
  }
});
var frontServer = http.createServer(function (req, res) {
  proxy.web(req, res);
});

//
// Listen to the `upgrade` event and proxy the
// WebSocket requests as well.
//
frontServer.on('upgrade', function (req, socket, head) {
  console.log('head', inspect(head.toString(), false, null));

  proxy.ws(req, socket, head);
});

const frontPort = 8015;
// frontServer.listen(frontPort);

module.exports = {
  frontServer,
  server,
  frontPort
};
