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
const port = 8999;
// start the proxySrv
const proxySrvApp = proxySrv();

// options
const config = {
  // Debugger: false,
  // Reload: false,
  inject: {
    source: [
      // DummyJs,
      'css/bootstrap.min.css',
      'css/starter-template.css',
      'js/bootstrap.min.js',
      'js/ie10-viewport-bug-workaround.js'
    ]
  },
  proxies: [{
    host: `http://localhost:${port}`,
    context: '/proxy'
  },{
    host: `http://localhost:${port}`,
    ws: true
  }],
  webroot: [join(__dirname, 'dist', 'assets'), join(__dirname, 'dist', 'base')]
};

// debug('options', config);

serverIoCore(config);
