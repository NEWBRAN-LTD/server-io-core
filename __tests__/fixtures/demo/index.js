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
const serverIoCore = require('../index');
const { join } = require('path');
const debug = require('debug')('server-io-core:dev');
// Const Koa = require('koa');
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
  webroot: [join(__dirname, 'dist', 'assets'), join(__dirname, 'dist', 'base')]
};

debug('options', config);

/*
Config.callback = () => {
  open(config);
  console.log('server started');
};
*/
// start
/*
const app = new Koa();
app.on('error', err => {
  debug('app level error', err);
});

const { webserver, start } = webserverGenerator(app, config);

app.use(renderScriptsMiddleware(config));
app.use(scriptsInjectorMiddleware(config));
// static serve
staticServe(config)(app);
// start server
start();
*/
serverIoCore(config);
