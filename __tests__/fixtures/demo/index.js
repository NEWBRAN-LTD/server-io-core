/**
 * Try out all the different koa functions here
 */
/*
const { webserverGenerator, staticServe } = require('../src/lib/server');
const open = require('../src/lib/utils/open');
const { createConfiguration } = require('../src/lib/options');
const { scriptsInjectorMiddleware, renderScriptsMiddleware } = require('../src/lib/injector');
const { dummyJs } = require('../src/lib/utils/constants');
*/
const serverIoCore = require('../../../index');
const { join } = require('path');
const debug = require('debug')('server-io-core:dev');
const proxySrv = require('../proxy');
const options = require('../options.json');

const port = options.proxy.port;
// start the proxySrv
const proxySrvApp = proxySrv();

// options
const config = {
  // debugger: true,
  // reload: true,
  // socket: true,
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
  proxies: [{
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

// debug('options', config);

serverIoCore(config);
