const test = require('ava');
const client = require('socket.io-client');
const http = require('http');
const options = require('./fixtures/options.json');
const server = require('./fixtures/server');
const proxy = require('./fixtures/proxy');
const port = options.proxy.port;

test.before(t => {
  // start the server behind proxy
  proxy();
  // start another server
  const { app, stop, io } = server({
    proxies: [{
      target: `http://localhost:${port}`,
      context: '/proxy'
    },{
      target: 'http://localhost:${port}',
      ws: true
    }]
  })
  t.context.app = app;
  t.context.stop = stop;
});

test.after(t => {
  t.context.stop();
});

test(`It should able to connect to another proxy on ${port}`, (t) => {

  http.get([options.defaultUrl, 'proxy'].join('/'), (resp) => {
    let data = '';
    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
      data += chunk;
    });
    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      debug('received data', data);
      t.is(options.message.banner, data);
    });
  });

  /* koa-nginx throw error */
  /*
  const ioClient = client(server.defaultUrl);

  ioClient.emit('message', options.message.send, reply => {
    t.is(options.message.reply, reply);
  });
  */
});
