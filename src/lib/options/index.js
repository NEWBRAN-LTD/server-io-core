/**
 * Create a default options to reduce the complexity of the main file
 */
const path = require('path');
const src = path.join(__dirname, '..', '..');
const { getServingIpforOS } = require('../utils/');

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
  'https',
  'wsProxy',
  'socket'
];
// Rename to the key defaultOptions
const defaultOptions = {
  /**
   * Basic options
   */
  development: true,
  host: getServingIpforOS(), // @2018-08-15 use the ip address by default
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
  // We have to seperate them, see README about reason why
  wsProxy: {
    enable: false,
    target: []
  },
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
    proxy: false,
    namespace: [] // New on v1.0.2
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
  // @TODO remove cordova option later, there is no use anymore
  cordova: false, // @2018-08-20 add this option to fake a cordova.js file
  inject: {
    enable: false,
    insertBefore: true,
    target: {}, // List of files to inject with head or body
    source: [], // List of files to get inject
    options: {} // Reversed for future use
  },
  // Client reload - default TRUE
  reload: {
    enable: true,
    verbose: false, // @2018-08-20 change to false as default
    interval: 1000,
    wait: 5000,
    namespace: '/reload-nsp',
    js: 'reload-client.js',
    eventName: 'filesChange',
    hello: 'IO RELOAD is listening ...'
  },
  // Create our socket.io debugger
  // using the socket.io instead of just normal post allow us to do this cross domain
  debugger: {
    enable: true, // Turn on by default otherwise they wouldn't be using this version anyway
    eventName: 'debugging',
    consoleDebug: true, // Overwrite the console.debug method
    verbose: false, // Add verbose option
    namespace: '/debugger-nsp',
    js: 'debugger-client.js',
    hello: 'IO DEBUGGER is listening ...', // Allow the user to change this as well
    broadcast: false,
    client: true, // Allow passing a configuration to overwrite the client
    server: true // Allow passing configuration - see middleware.js for more detail
  },
  // @TODO remove later no longer support
  mock: {
    enable: false
  },
  serverReload: {
    enable: false
  }
};
const arraySource = ['middlewares', 'proxies', 'wsProxy.target'];
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
