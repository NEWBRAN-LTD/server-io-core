const debug = require('debug')('server-io-core:test-client');
/*
const {
  proxyConfig,
  namespace
} = require('./socket');
*/
const port = 8015;
const namespace = 'behind-the-proxy';

const socketIoClient = require('socket.io-client');

const nsp = socketIoClient(`http://localhost:${port}/${namespace}`);

nsp.on('connect', () => {
  debug('conneced');
  nsp.on('msg', msg => {
    debug('Alright! got a message', msg);
  });
  setTimeout(function() {
    nsp.emit('reply', 'Here is my reply to you!');
  }, 2000);
})
