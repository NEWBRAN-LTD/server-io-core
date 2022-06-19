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
  'socket'
];
// Rename to the key defaultOptions
const defaultOptions = {
  /**
   * Basic options
   */
  development: true,
  host: getServingIpforOS(), // @2018-08-15 use the ip address by default
  port: 8000, // try a random port and see what happens
  port0: 8001,
  // Path: '/', // @2018-07-31 this no longer in use
  webroot: path.join(process.cwd(), 'app'),
  autoStart: true,
  fallback: false,
  index: 'index.html', // Can only have one!
  callback: () => {},
  staticOptions: {},
  headers: {},
  middlewares: [],
  favicon: null, // Pass a string path then we search for favicon, false disable it
  // Middleware: Proxy
  // @NOTE 2022-06-17
  // there is one way to fix the proxy with socket
  // but require a complete re-engineer of how this app start 
  // basically if we want to do proxy, we actually run the proxy server first 
  // then our own dev server run on a random port then from the front port proxy back into it 
  // then the proxy will deal with other locations as well 
  proxies: [],
  proxyTimeout: 5000, // This is actually useless
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
  inject: {
    enable: false,
    insertBefore: true,
    target: {}, // List of files to inject with head or body
    source: [], // List of files to get inject
    options: {}, // Reversed for future use
    replace: [], // @1.3.0 a tag to replace with a string
    processor: args => args
  },
  // Client reload - default TRUE
  reload: {
    enable: true,
    verbose: false, // @2018-08-20 change to false as default
    interval: 1000,
    wait: 5000,
    displayLog: false,
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