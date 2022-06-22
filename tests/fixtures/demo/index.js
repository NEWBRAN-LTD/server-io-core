/**
 * Try out all the different koa functions here
 */
const serverIoCore = require('../../../index');
const { join } = require('path');
const debug = require('debug')('server-io-core:dev');
const options = require('../options.json');

// Options
const config = {
  // Debugger: true,
  reload: {
    displayLog: true
  },
  // Socket: true,
  inject: {
    source: [
      // DummyJs,
      'css/bootstrap.min.css',
      'css/starter-template.css',
      'js/bootstrap.min.js',
      'js/ie10-viewport-bug-workaround.js'
      // 'socket.io-client/dist/socket.io.js',
      // 'js/socket-client.js'
    ]
  },
  /*
  Proxies: [{
    host: `http://localhost:${port}`,
    context: '/proxy'
  }], */
  // wsProxy: `http://localhost:${port}`,
  webroot: [
    join(__dirname, 'dist', 'assets'),
    join(__dirname, 'dist', 'base'),
    join(__dirname, '..', '..', '..', 'node_modules')
  ]
};

// Debug('options', config);

serverIoCore(config);
