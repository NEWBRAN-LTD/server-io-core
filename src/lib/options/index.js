/**
 * Create a default options to reduce the complexity of the main file
 */
const path = require('path');
const src = path.join(__dirname, '..', '..');
const { getLocalIp } = require('../utils/helper');
// Also export the function here
const enableMiddlewareShorthand = require('./enable-middleware-shorthand');
// Move from the app.js to here
const defaultProperties = [
  'reload',
  'debugger',
  'mock',
  'serverReload',
  'inject',
  'open',
  'https'
];
// Rename to the key defaultOptions
const defaultOptions = {
  /**
   * Basic options
   */
  development: true,
  host: getLocalIp(), // @2018-08-15 use the ip address by default
  port: 8000,
  // Path: '/', // @2018-07-31 this no longer in use
  webroot: path.join(process.cwd(), 'app'),
  autoStart: true,
  fallback: false,
  index: 'index.html', // Can only have one!
  callback: () => {},
  staticOptions: {},
  headers: {},
  middlewares: [],
  // Middleware: Proxy
  // For possible options, see:
  // https://github.com/chimurai/http-proxy-middleware
  // replace with the `http-proxy-middleware`
  // @2018-03-19 it was just an array but some how the lodash.merge turns an
  // object into an array so when we call it, it couldn't tell
  proxies: [],
  proxyTimeout: 5000,
  // Stock certicates @TODO combine this together
  open: {
    enable: true,
    browser: ''
  },
  https: {
    enable: false,
    devKeyPem: path.join(src, 'certs', 'cert.pem'),
    devCrtPem: path.join(src, 'certs', 'cert.crt')
  },
  /**
   * NOTE:
   * new at 1.5 take out the socket config
   * this is ready for the future V.2 develop to have
   * socket proxy out to a third parties server
   */
  socket: {
    enable: true,
    socketOnly: true,
    transportConfig: ['websocket'],
    proxy: false
  },
  /**
   * MIDDLEWARE DEFAULTS
   * NOTE:
   *  All middleware should defaults should have the 'enable'
   *  property if you want to support shorthand syntax like:
   *    webserver({
   *      reload: true
   *    });
   */
  // @TODO help the user to track their server reload method
  serverReload: {
    enable: false,
    dir: '/srv',
    config: {
      verbose: true,
      debounce: 500
    },
    callback: () => {
      console.log('server reload callback executed');
    }
  },
  inject: {
    enable: false,
    insertBefore: true,
    target: [], // List of files to inject
    source: [], // List of files to get inject
    options: {} // Reversed for future use
  },
  // New mock server using json-server, please note if this is enable then
  // The proxy will be disable
  mock: {
    enable: false,
    json: false,
    port: 3838,
    path: 'localhost',
    watch: true,
    interval: 500 // Listener interval to restart the server, false then don't restart
  },
  // Client reload - default TRUE
  reload: {
    enable: true,
    verbose: true,
    interval: 500,
    namespace: '/reload-nsp',
    js: 'reload-client.js',
    eventName: 'filesChange',
    hello: 'IO RELOAD is listening ...'
  },
  // Create our socket.io debugger
  // using the socket.io instead of just normal post allow us to do this cross domain
  debugger: {
    eventName: 'debugging',
    enable: true, // Turn on by default otherwise they wouldn't be using this version anyway
    consoleDebug: true, // Overwrite the console.debug method
    namespace: '/debugger-nsp',
    js: 'debugger-client.js',
    hello: 'IO DEBUGGER is listening ...', // Allow the user to change this as well
    client: true, // Allow passing a configuration to overwrite the client
    server: true // Allow passing configuration - see middleware.js for more detail
  }
};
const arraySource = ['middlewares', 'proxies'];
// Export just one function
module.exports = {
  defaultOptions,
  defaultProperties,
  createConfiguration: function(options = {}) {
    return enableMiddlewareShorthand(
      defaultOptions,
      defaultProperties,
      arraySource,
      options
    );
  }
};
