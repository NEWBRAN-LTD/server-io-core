'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var socket_ioClient = require('socket.io-client');
var socket_io = require('socket.io');
var debugFn = require('debug');
var open = require('open');
var fs = require('node:fs');
var os = require('node:os');
var path = require('node:path');
var util = require('node:util');
var url = require('node:url');
var log = require('fancy-log');
var template = require('lodash.template');
var process$1 = require('process');
var fsx = require('fs-extra');
var utils = require('@jsonql/utils');
var Koa = require('koa');
var http = require('node:http');
var https = require('node:https');
var send = require('koa-send');
var EventEmitter = require('node:events');
var node_child_process = require('node:child_process');
var kefir = require('kefir');
var bodyParser = require('koa-bodyparser');
var cheerio = require('cheerio');
var glob = require('glob');
var HttpProxy = require('http-proxy');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var debugFn__default = /*#__PURE__*/_interopDefaultLegacy(debugFn);
var open__default = /*#__PURE__*/_interopDefaultLegacy(open);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var os__default = /*#__PURE__*/_interopDefaultLegacy(os);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var util__default = /*#__PURE__*/_interopDefaultLegacy(util);
var url__default = /*#__PURE__*/_interopDefaultLegacy(url);
var log__default = /*#__PURE__*/_interopDefaultLegacy(log);
var template__default = /*#__PURE__*/_interopDefaultLegacy(template);
var fsx__default = /*#__PURE__*/_interopDefaultLegacy(fsx);
var Koa__default = /*#__PURE__*/_interopDefaultLegacy(Koa);
var http__default = /*#__PURE__*/_interopDefaultLegacy(http);
var https__default = /*#__PURE__*/_interopDefaultLegacy(https);
var send__default = /*#__PURE__*/_interopDefaultLegacy(send);
var EventEmitter__default = /*#__PURE__*/_interopDefaultLegacy(EventEmitter);
var kefir__default = /*#__PURE__*/_interopDefaultLegacy(kefir);
var bodyParser__default = /*#__PURE__*/_interopDefaultLegacy(bodyParser);
var cheerio__default = /*#__PURE__*/_interopDefaultLegacy(cheerio);
var glob__default = /*#__PURE__*/_interopDefaultLegacy(glob);
var HttpProxy__default = /*#__PURE__*/_interopDefaultLegacy(HttpProxy);

// Share constants
const DEBUG_MAIN_KEY = 'server-io-core';
/**
 * Take out the magic variables
 */
const stacktraceName = 'stacktrace.js';
const contentType = 'application/javascript; charset=utf-8';
const CSS_CONTENT_TYPE = 'text/css; charset=utf8';

const dummyJs = '/server-io-core-dummy.js';
const DEFAULT_HOST_IP = '0.0.0.0';
const cordovaJs = 'cordova.js';
const WS_PROXY = 'wsProxy';
const MASTER_MIND = 'masterMind';
const TRANSPORT = ['websocket'];
const AUTO_START = 'autoStart';

const DEFAULT_HOSTNAME = 'localhost';

const MAX_AGE = 86400000;
const MAX_MAX_AGE = 31556926000;
const EVENT_NAME = 'change';
const DEFAULT_WAIT = 5000;
// we use random port
const DEFAULT_PORT = 0;
const DEFAULT_HOST = 'localhost';
const INTERNAL_PORT = '__internal_port__';

const CONTEXT_KEY = 'context';

// main
function getDebug (key) {
  return debugFn__default["default"]([DEBUG_MAIN_KEY, key].join(':'))
}

// Utils
const IS_TEST = process.env.NODE_ENV === 'test';

/** wrap this one function because there is case the __dirname is wrong! */
function getPkgInfo (pkgFile) {
  if (fsx__default["default"].existsSync(pkgFile)) {
    return fsx__default["default"].readJsonSync(pkgFile)
  }
  return { version: 'UNKNOWN' }
}

function objLength (obj) {
  return Object.keys(obj).length
}

/**
  url --> import.meta.url
  @BUG the cjs version return one level up cause all sorts of porblem
*/
function getDirname (url$1) {
  try {
    console.log('cjs', __dirname);
    return __dirname
  } catch (e) {
    const __filename = url.fileURLToPath(url$1);
    // console.log(__filename)
    return path__default["default"].dirname(__filename)
  }
}

/** the key is a dot path */
function get (obj, key) {
  const keys = key.split('.');
  const ctn = keys.length;
  let result;
  for (let i = 0; i < ctn; ++i) {
    const k = keys[i];
    if (!result) {
      result = obj[k];
    } else {
      result = result[k];
    }
  }
  return result
}

/**
 * @return {string} ip address
 */
const getLocalIp = () => (
  Object.values(os__default["default"].networkInterfaces()).filter(net => {
    return net[0].address !== '127.0.0.1'
  }).reduce((last, next) => {
    return last.concat([next[0].address])
  }, [])
);

/**
 * @return {boolean} windoze or not
 */
const isWindoze = () => (os__default["default"].platform().indexOf('win') === 0);

/**
 * If's it's windows then need to get the ip address of the network interface
 * otherwise we just need to use 0.0.0.0 to bind to all
 * @return {string} ip address
 */
const getServingIpforOS = () => {
  const hasBug = process$1.version.indexOf('v18') > -1;
  if (hasBug) {
    return ['localhost'] // V.18 has bug that can not bind to ip but localhost
  }
  const ip = getLocalIp();
  if (isWindoze()) {
    return ip
  }
  return [DEFAULT_HOST_IP].concat(ip)
};

// Const debug = process.env.DEBUG;
// Main
const logutil = function (...args) {
  if (!IS_TEST) {
    Reflect.apply(log__default["default"], null, args);
  }
};

/**
 * For use in debugger / reload client file generator
 */
const getSocketConnectionConfig = config => {
  let connectionOptions =
    ", {'force new connection': false , 'transports': ['websocket']}";
  if (typeof config.server === 'object') {
    if (
      config.server.clientConnectionOptions &&
      typeof config.server.clientConnectionOptions === 'object'
    ) {
      connectionOptions =
        ', ' + JSON.stringify(config.server.clientConnectionOptions);
    }
  }
  return connectionOptions
};

/**
 * The koa ctx object is not returning what it said on the documentation
 * So I need to write a custom parser to check the request content-type
 * @param {object} req the ctx.request
 * @param {string} type (optional) to check against
 * @return {mixed} Array or Boolean
 */
const headerParser = (req, type) => {
  try {
    const headers = req.headers.accept.split(',');
    if (type) {
      return headers.filter(h => {
        return h === type
      })
    }
    return headers
  } catch (e) {
    // When Chrome dev tool activate the headers become empty
    return []
  }
};

/**
 * get document (string) byte length for use in header
 * @param {string} doc to calculate
 * @return {number} length
 */
const getDocLen = doc => {
  return Buffer.byteLength(doc, 'utf8')
};

/**
 * turn callback to promise
 * @param {string} p path to file
 * @return {object} promise to resolve
 */
const readDocument = p => new Promise((resolve, reject) => {
  fs__default["default"].readFile(p, { encoding: 'utf8' }, (err, data) => {
    if (err) {
      return reject(err)
    }
    resolve(data);
  });
});

/**
 * @param {array} files to search
 * @return false on not found
 */
const searchFileFromFiles = files => files
  .filter(fs__default["default"].existsSync)
  .reduce((last, next) => {
    return next
  }, null);

/**
 * Search for the default index file
 * @param {object} config the serveStatic options
 * @return {string} path to the index file
 */
const searchIndexFile = config => {
  const { webroot, index } = config;
  const webroots = utils.toArray(webroot);
  return webroots
    .map(d => [d, index].join('/'))
    .filter(fs__default["default"].existsSync)
    .reduce((last, next) => {
      return next
    }, null)
};

/**
 * Double check if its a HTML file
 * @param {string} file path
 * @return {boolean} or not
 */
const isHtmlFile = file => {
  const ext = path__default["default"].extname(file).toLowerCase();
  return ext === '.html' || ext === '.htm'
};

/**
 * strip the root slash for the proxy context
 * @param {string} str input
 * @return {string} output without first slash
 */
const stripFirstSlash = str => {
  const first = str.substring(0, 1);
  if (first === '/') {
    return str.substring(1)
  }
  return str
};

/**
 * make sure there is a slash before the namespace
 * @param {string} str input
 * @return {string} output with slash at the beginning
 */
const ensureFirstSlash = str => '/' + stripFirstSlash(str);

// Open in browser

const debug$c = getDebug('open');

/**
 * Get hostname to open
 * @param {string} hostname config.hostname
 * @return {string} modified hostname
 */
const getHostname = hostname => {
  const h = Array.isArray(hostname) ? hostname[0] : hostname;
  return isWindoze() ? h : h === DEFAULT_HOST_IP ? DEFAULT_HOSTNAME : h
};

/**
 * Construct the open url
 * @param {object} config full configuration
 * @return {string} url
 */
const constructUrl = config => {
  return [
    'http' + (config.https.enable === false ? '' : 's'),
    '//' + getHostname(config.host),
    config.port
  ].join(':')
};

/**
 * Add try catch because sometime if its enable and try this from the server
 * and it will throw error
 * @param {object} config options
 * @return {boolean} true on open false on failed
 */
function openInBrowser (config) {
  try {
    debug$c('[open configuration]', config.open);
    let multiple = false;
    const args = [constructUrl(config)];
    // If there is just the true option then we need to construct the link
    if (config.open.browser) {
      if (utils.isString(config.open.browser)) {
        args.push({ app: config.open.browser });
      } else if (Array.isArray(config.open.browser)) {
        multiple = config.open.browser.map(browser => {
          return { app: browser }
        });
      }
    }
    // Push this down for the nyc to do coverage deeper
    if (process.env.NODE_ENV === 'test' || config.open.enable === false) {
      return args
    }

    if (multiple === false) {
      debug$c('[open]', args);
      Reflect.apply(open__default["default"], open__default["default"], args);
    } else {
      // Open multiple browsers at once
      multiple.forEach(browser => {
        debug$c('[open]', browser, args);
        Reflect.apply(open__default["default"], open__default["default"], args.concat([browser]));
      });
    }
    return true
  } catch (e) {
    debug$c('[open] error:', e);
    return false
  }
}

// use the console.table to show some fancy output

function startMsg (config) {
  if (process.env.NODE_ENV === 'test') {
    return // do nothing
  }
  const list = {};
  list.banner = `server-io-core (${config.version})`;
  const displayHost = Array.isArray(config.host) ? config.host[1] : config.host;
  list.hostname = [
    'http',
    config.https.enable ? 's' : '',
    '://',
    displayHost,
    ':',
    config.port
  ].join('');
  list.internal = `http://${DEFAULT_HOST}:${config.port0}`;
  // show table
  if (process.env.DEBUG) {
    console.table(list); // need more work
  }
}

// Move from the app.js to here
// generate a timestamp
const ts = utils.timestamp();
// const __dirname = getDirname(import.meta.url)
// const src = join(__dirname, '..', '..')
const defaultProperties = [
  'reload',
  'debugger',
  'mock',
  'serverReload',
  'inject',
  'open',
  'https',
  'socket',
  'masterMind'
];
const arraySource = ['middlewares', 'proxies'];
const defaultOptions = {
  NODE_VERSION: process$1.version, // 2022-06-21 discover v18 has bug with the http.createServer!
  /**
   * Basic options
   */
  development: true,
  host: getServingIpforOS(), // @2018-08-15 use the ip address by default
  port: 8000,
  port0: 0, // this is for internal use only
  // Path: '/', // @2018-07-31 this no longer in use
  webroot: path.join(process.cwd(), 'app'), // should this be empty?
  autoStart: true,
  fallback: false,
  index: 'index.html', // Can only have one!
  callback: () => {},
  staticOptions: {},
  headers: {},
  middlewares: [],
  favicon: null, // Pass a string path then we search for favicon, false disable it
  cordova: false,
  qunit: false, // serve up qunit unit files locally
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
    // for security reason we are NOT going to supply any pre-build certs
    devKeyPem: 'cert.pem',
    devCrtPem: 'cert.crt'
  },
  /**
   * NOTE:
   * v.1.5 take out the socket config
   * this is ready for the future V.2 develop to have
   * socket proxy out to a third parties server
   */
  socket: {
    enable: true,
    socketOnly: true,
    transportConfig: ['websocket'],
    proxy: false,
    namespace: [], // v1.0.2
    path: `/server-io-core-ws-${ts}/` // v2.2.0 - 2.3.0 make it random
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
    dir: [], // V.2.2.0 features search a directories
    excluded: [], // V.2.2.0 excluding this files from the search directory
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
    enable: true, // Turn on by default otherwise they wouldn't be using this anyway
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
  masterMind: { // 2.3.0
    enable: false,
    client: true,
    namespace: '/mastermind-nsp'
  }
};

/**
 * @2018 Port from the original gulp-webserver
 * @2022 already changed 90% of the code
 */
/**
 * prepare the proxies configuration
 */
function prepareProxies (config) {
  if (config.proxies && Array.isArray(config.proxies)) {
    if (config.proxies.length > 0) {
      config.proxies = config.proxies
        .filter(c => c.type && c.context && c.target)
        .map(c => {
          c[CONTEXT_KEY] = ensureFirstSlash(c[CONTEXT_KEY]);
          return c
        });
    }
    return config
  }
  throw new Error('Your proxies configuration must be an array!')
}

/**
 * Make sure the incoming parameter to be array when it's coming out
 * @param {array} arraySource list of keys to process
 * @param {object} options the user supply options
 * @return {object} the key props should be array
 */
const ensureArrayProps = (arraySource, options) => {
  return arraySource
    .map(key => {
      // @2019-05-07 if we pass it as a path
      if (key.indexOf('.') > -1) {
        const value = get(options, key);
        const parts = key.split('.');
        const objKey = parts[0];
        const propKey = parts[1];
        // Here could be a problem if the level is deeper than one
        return {
          [objKey]: utils.merge({}, options[objKey], { [propKey]: utils.toArray(value) })
        }
      }
      if (options[key]) {
        return { [key]: utils.toArray(options[key]) }
      }
      return { [key]: [] }
    })
    .reduce((next, last) => {
      return utils.extend(next, last)
    }, options)
};

/**
 * Make sure we get the config in an array
 * @param {object} config for wsProxy
 * @return {mixed} false on failed!
 */
const extractArrayProps = config => {
  if (typeof config === 'object' && config.target && config.enable !== false) {
    return utils.toArray(config.target)
  }
  if (Array.isArray(config)) {
    return config
  }
  return false
};

/**
 * A bit of sideway hack to correct the configuration for a special case
 * wsProxy
 * @param {string} key looking for particular key to work with
 * @param {object} config the config object for that key
 * @param {object} originalDefaults the default options
 * @return {object} the corrected config object
 */
const handleSpecialCase = (key, config, originalDefaults) => {
  if (key === WS_PROXY) {
    const target = extractArrayProps(config);
    if (target !== false) {
      return {
        enable: true,
        target: target
      }
    }
  } else if (key === MASTER_MIND) {
    if (utils.trueTypeOf(config) === 'boolean' && config === true) {
      const defaults = originalDefaults[key];
      const { namespace } = defaults;
      return { namespace, enable: true, client: true }
    } else if (utils.trueTypeOf(config) === 'string') {
      return { namespace: ensureFirstSlash(config), enable: true, client: true }
    } else if (utils.trueTypeOf(config) === 'object') {
      return {
        enable: true,
        client: config.client,
        namespace: ensureFirstSlash(config.namespace)
      }
    }
  }
  // @TODO handle the masterMind config here
  return false
};

/**
 * @param {object} defaults the stock options
 * @param {array} props special properties need preserved
 * @param {array} arraySource list of keys that is using array as default
 * @param {object} options configuration params pass by the developer
 * @return {object} configuration
 */
function enableMiddlewareShorthand (
  defaults,
  props,
  arraySource,
  options
) {
  // Make a copy to use later
  const originalOptions = utils.merge({}, options);
  const originalDefaults = utils.merge({}, defaults);
  /*
    @2018-03-19 The bug is here when call the merge
    lodash.merge merge object into array source turns it into
    a key / value array instead of numeric
    so for the special case `middleware` `proxies`
    we need to double check here before calling the merge function,

    again another problem with the prop inside an object that is not array but
    we need it to be an array
  */
  const tmpProp = ensureArrayProps(arraySource, options);
  const config = utils.merge({}, defaults, tmpProp);
  // This just make sure it's an array
  if (Object.prototype.toString.call(props) === '[object String]') {
    props = [props];
  }
  for (let i = 0, len = props.length; i < len; ++i) {
    const prop = props[i];
    // Debug('prop', prop);
    /**
     * The problem is when someone pass optionName: true
     * it just using the default options
     * what if they just pass alternative config without passing
     * enable: true
     * then the feature is not enable
     */
    const specialCase = handleSpecialCase(prop, config[prop], originalDefaults);
    if (specialCase !== false) {
      config[prop] = specialCase;
    } else if (config[prop] === true) {
      config[prop] = utils.merge({}, originalDefaults[prop]);
      config[prop].enable = true;
    } else if (originalOptions[prop] && Object.keys(originalOptions[prop]).length) {
      // If the user has provided some property
      // Then we add the enable here for the App to use
      config[prop].enable = true;
    } else if (config[prop] === false) {
      config[prop] = utils.merge({}, originalDefaults[prop], { enable: false });
    }
  }
  // Change from sessionId to timestamp, just for reference not in use anywhere
  config.timestamp = Date.now();
  return config
}

// prepare config
// main method
function createConfiguration (options = {}) {
  const config = enableMiddlewareShorthand(
    defaultOptions,
    defaultProperties,
    arraySource,
    options
  );
  return prepareProxies(config)
}

// just wrapper to socket.io
// Socket.io Server
class WSServer extends socket_io.Server {}
// Socket.io node client
const WSClient = (url, config = {}) => socket_ioClient.io(url, utils.extend({
  transports: TRANSPORT
}, config));

/**
 * The generated server code are identical on both side anyway
 */
// According to https://github.com/visionmedia/supertest/issues/111
// Put this here to make sure it works everywhere
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
/**
 * @param {object} app the connect app
 * @param {object} config options
 * @return {object} http(s) webserver, (fn) start, (fn) stop
 */
function webserverGenerator (app, config) {
  let webserver;
  if (config.https.enable) {
    let opts;
    let msg = '';
    if (config.https.key && config.https.cert) {
      if (fs__default["default"].existsSync(config.https.key) && fs__default["default"].existsSync(config.https.cert)) {
        opts = {
          key: fs__default["default"].readFileSync(config.https.key),
          cert: fs__default["default"].readFileSync(config.https.cert)
        };
      } else {
        msg = 'The key or cert you provide via the https configuration can not be found!';
        logutil('[https Error]', msg);
        throw new Error(msg)
      }
    } else if (config.https.pfx && config.https.passphrase) {
      if (fs__default["default"].existsSync(config.https.pfx)) {
        opts = {
          pfx: fs__default["default"].readFileSync(config.https.pfx),
          passphrase: config.https.passphrase
        };
      } else {
        msg = 'The pfx you prvide via the https configuration can not be found!';
        logutil('[https Error]', msg);
        throw new Error(msg)
      }
    } else {
      // Need to check if the user provide file exist or not!
      opts = {
        key: fs__default["default"].readFileSync(config.https.devKeyPem),
        cert: fs__default["default"].readFileSync(config.https.devCrtPem)
      };
    }
    // @2018-07-30 change to Koa style
    webserver = https__default["default"].createServer(opts, app.callback());
  } else {
    // See last comment
    webserver = http__default["default"].createServer(app.callback());
  }
  // @2018-08-20 add a new double ip options for serving and display
  // @2022-06-18 this moved to the main proxy
  // const hostname = Array.isArray(config.host) ? config.host[0] : config.host
  // Return it
  return {
    webserver,
    startInternal: async () => {
      return new Promise(resolve => {
        // @TODO this will be using a port:0 which means we are going to get a random port
        // and we return this for the main proxy to use
        webserver.listen(
          config.port0 || DEFAULT_PORT, // we could pick a port for test purpose
          // DEFAULT_HOST,
          () => {
            resolve(webserver.address().port);
            // the callback now move to the public server
          }
        );
      })
    },
    stopInternal: () => {
      webserver.close();
    }
  }
}

/**
 * Modified from koa-static to allow us intercept the content and overwritten them
 */
const debug$b = getDebug('static-serve');
/**
 * Customize version of koa-static
 * @param {object} app the Koa instance
 * @param {object} config full options
 * @return {function} to call
 * @api public
 */
function serverStatic (app, config) {
  const dirs = utils.toArray(config.webroot);
  const opts = { defer: true };
  if (config.index) {
    opts.index = config.index;
  }
  // V.2 we just run through it
  dirs.forEach(dir => {
    app.use(serve(dir, opts));
  });
  logutil('[Static Serve] File serve up from', dirs);
}
/**
 * Serve static files from `root`.
 * @param {String} root webroot
 * @param {Object} [opts] what to do
 * @return {Function} to call
 */
function serve (root, opts) {
  opts = Object.assign({}, opts);
  // Assert(root, 'root directory is required to serve files');
  // Options
  // debug('static "%s" %j', root, opts);
  opts.root = root;
  if (opts.index !== false) {
    opts.index = opts.index || 'index.html';
  }
  if (!opts.defer) {
    return async function middleware (ctx, next) {
      let done = false;
      if (ctx.method === 'HEAD' || ctx.method === 'GET') {
        try {
          done = await send__default["default"](ctx, ctx.path, opts);
        } catch (err) {
          if (err.status !== 404) {
            debug$b('Unknown error', err);
            throw err
          }
        }
      }
      if (!done) {
        await next();
      }
    }
  }
  return async function middleware (ctx, next) {
    await next();
    let exit = false;
    // Check certain method
    if (ctx.method !== 'HEAD' && ctx.method !== 'GET') {
      exit = true;
    }
    // Response is already handled
    // @bug from Koa ctx.body is undefined not null
    if ((ctx.body !== undefined && ctx.body !== null) || ctx.status !== 404) {
      exit = true;
    }
    if (exit) {
      return false
    }
    try {
      await send__default["default"](ctx, ctx.path, opts);
    } catch (err) {
      if (err.status !== 404) {
        throw err
      }
    }
  }
}

/**
 * Socket server generator
 */
/**
 * @param {object} server http server instance
 * @param {object} config full config options
 * @return {object} io instance
 */
function socketIoGenerator (server, config) {
  // Force the socket.io server to use websocket protocol only
  let socketConfig = TRANSPORT;
  // if we want to use different protocol
  if (config.socket.socketOnly &&
    config.socket.transportConfig &&
    Array.isArray(config.socket.transportConfig)
  ) {
    socketConfig = config.socket.transportConfig;
  }
  // Need to take this constructor out and re-use with the reload
  const io = new WSServer(server, {
    transports: socketConfig,
    path: config.socket.path // V2.2.0 custom path
  });
  if (Array.isArray(config.namespace) && config.namespace.length) {
    socketCb(io, config.namespace);
  }
  // Export it again
  return io
}
// V1.0.2
// We create a custom namespace that allow a third party module to call it
// then pass a callback to handle this calls
// also pass this to the callback for the developer to use
function socketCb (io, namespace) {
  const ctn = namespace.length;
  for (let i = 0; i < ctn; ++i) {
    const { path, callback } = namespace[i];
    if (
      path && typeof path === 'string' &&
      callback && typeof callback === 'function'
    ) {
      const nsp = io.of(path);
      callback(nsp, io, WSClient);
    }
  }
}

/*
  Rethink about how to deal with templates
  The problem is the cjs version need to copy over the files
  and that's gonna be PIA, instead all templates now become
  string literal and makes it easier to deal with in different env
*/
const debuggerClientTpl = `
(function(window , navigator, StackTrace)
{
  'use strict'
  var nsp = io('<%= debuggerPath %>', {
    transports: ['websocket'] {0}
  })

  /**
   * @param {object} payload send to the server
   */
  var send = function(payload) {
    payload.browser = navigator.userAgent
    payload.location = window.location.href
    nsp.emit('<%= eventName %>', payload)
  }

  /**
   * listen to the init connection
   */
  nsp.on('hello', function (msg) {
    console.log('debugger init connection: ' , msg)
  })

  /**
   * core implementation
   */
  window.onerror = function(msg, file, line, col, error) {
    // callback is called with an Array[StackFrame]
    StackTrace.fromError(error)
      .then(function(data) {
        console.info('catch error', error)
        send({ msg: data, from: 'error', color: 'warning' })
      })
      .catch(function(err) {
        console.error('onerror error!', err)
        var _msg = { msg: msg, file: file, line: line, col: col }
        send({ msg: _msg, from: 'catch onerror', color: 'debug' })
      })
  }

  /**
   * handle the unhandled ajax rejection
   * @param {object} e Error
   */
  window.onunhandledrejection = function(e) {
    console.info('onunhandledrejection', e)
    send({
      msg: e,
      from: 'onunhandledrejection',
      color: 'warning'
    })
    /* @TODO
    stack trace never able to parse the unhandle rejection
    StackTrace.fromError(e.reason || e)
      .then(function(data) {
        send({ msg: data, from: 'onunhandledrejection', color: 'warning' })
      })
      .catch(function(err) {
        console.error('onunhandledrejection', err)
        send({ msg: err, from: 'catch onunhandledrejection', color: 'debug' })
      })
    */
  }
<% if (consoleDebug) { %>
  /**
   * added on V1.5.0 overwrite the console.debug
   */
  console.debug = function() {
    var args = Array.prototype.slice.call(arguments)
    send({ msg: args, from: 'debug' })
  };
<% } %>
})(window , navigator, StackTrace)
`;

/**
 * Take out a bunch of functions from the original debugger setup
 */

const keys = ['browser', 'location'];
const lb = '-'.repeat(90);

// Ditch the npm:table
const table = rows => {
  if (Array.isArray(rows)) {
    rows.forEach(row => logutil(row));
  } else {
    logutil(rows);
  }
};

const parseObj = data => {
  try {
    return JSON.parse(data)
  } catch (e) {
    return data
  }
};

// Encap to one func
const displayError = e => {
  // This is required so we just do a simple test here
  // logutil('check typeof ' + data.toString());
  const rows = [];
  if (e.from) {
    rows.push(`FROM: ${e.from}`);
  }
  keys.forEach((key) => {
    if (e[key]) {
      rows.push([key + ':', e[key]].join(' '));
    }
  });
  const _msg = parseObj(e.msg);
  if (utils.isString(_msg)) {
    rows.push(['MESSAGE:', e.msg].join(' '));
  } else {
    let toShow;
    const msgToArr = utils.isString(_msg) ? parseObj(_msg) : _msg;
    if (Array.isArray(msgToArr)) {
      rows.push('MESSAGE(S):');
      msgToArr.forEach(a => {
        if (typeof a === 'object') {
          rows.push(lb);
          for (const k in a) {
            const v = a[k];
            if (v) {
              toShow = utils.isObject(v) ? util__default["default"].inspect(v, false, null) : v;
              rows.push([k + ':', toShow].join(' '));
            }
          }
        } else {
          rows.push(a);
        }
      });
      rows.push([lb, 'END'].join(' '));
    } else if (utils.isObject(_msg)) {
      rows.push(lb);
      for (const k in _msg) {
        rows.push([k + ':', _msg[k]].join(' '));
      }
      rows.push([lb + 'END'].join(' '));
    } else {
      // This is to accomdate the integration with other logging system sending back different messages
      rows.push(
        ['MESSAGES:', util__default["default"].inspect(_msg, false, null)].join(
          ' '
        )
      );
    }
  }
  table(rows);
};

/**
 * The socket.io server and reporting
 */
const debug$a = getDebug('debugger');

/**
 * DebuggerServer
 * @param {object} config - the full configuration object
 * @param {object} io socket server instance
 * @return {function} close method
 */
function debuggerServer (config, io) {
  // Show if this is running
  logutil(
    '[debugger] ' +
      'server is running' +
      ' ' +
      config.version +
      (config.debugger.broadcast ? '[broadcasting]' : '')
  );
  // Run
  const nsp = io.of(config.debugger.namespace);
  // Start
  nsp.on('connection', (socket) => {
    // Announce to the client that is working
    socket.emit('hello', config.debugger.hello);
    // Listen
    socket.on(config.debugger.eventName, (data) => {
      try {
        // Console log output
        const time = new Date().toString();
        // Output to console
        logutil('io debugger msg @ ' + time);
        const error = parseObj(data);
        if (config.debugger.broadcast) {
          nsp.emit('broadcastdebug', { time, error });
        }

        if (typeof error === 'string') {
          table(['STRING TYPE ERROR', error]);
        } else if (typeof error === 'object') {
          // Will always be a object anyway
          displayError(error);
        } else {
          // Dump the content out
          table([
            'UNKNOWN ERROR TYPE',
            util__default["default"].inspect(data, false, 2)
          ]);
        }
      } catch (e) {
        debug$a('emit internal error', e);
      }
    });
    // Extra listener
    if (config.debugger.verbose) {
      socket.on('disconnect', () => {
        logutil('Debugger client disconnected');
      });
    }
  }); // End configurable name space
  // return a close method
  return () => {
    // Get Object with Connected SocketIds as properties
    const connectedNameSpaceSockets = Object.keys(nsp.connected);
    connectedNameSpaceSockets.forEach(socketId => {
      // Disconnect Each socket
      nsp.connected[socketId].disconnect();
    });
    // Remove all Listeners for the event emitter
    nsp.removeAllListeners();
    delete io.nsps[config.debugger.namespace];
  }
}

const reloadTpl = `(function()
{
  'use strict'
  var nsp = io('<%= reloadNamespace %>', {
    transports: ['websocket'] {0}
  })

  nsp.on('hello', function(msg) {
    console.log('reload nsp init connection', msg)
  })

  nsp.on('error', function(err) {
    console.error('error', error)
  })

  nsp.on('<%= eventName %>', function(payload) {
    // js 1.2 (latest)
    <% if (displayLog) { %>
      console.info('reload payload', payload)
    <% } %>
    window.location.reload(true)
  })
})()`;

/**
 * This file will only get call from the main setup process as a fork process
 * And communicate back via the subprocess.send
 */
// setup
const __dirname$3 = getDirname((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('mastermind.js', document.baseURI).href)));
const watcherFile = path.join(__dirname$3, 'fork.mjs');
const debug$9 = getDebug('watchers');
const lastChangeFiles = new Set();
class WatcherCls extends EventEmitter__default["default"] {}

// Main export
// we now return a function for stopping it
function watcherGenerator (config) {
  const evt = new WatcherCls();
  const props = node_child_process.fork(watcherFile);
  let stream;
  try {
    props.send({ type: 'start', config });
    debug$9('[Watcher][start]', config.filePaths);
    if (config.verbose) {
      logutil('[Watcher][start]', config.filePaths);
    }
    // V1.0.3 we add back the kefir here to regulate the socket callback
    stream = kefir__default["default"].stream(emitter => {
      // Listen to the channel
      props.on('message', opt => {
        if (config.verbose) {
          logutil(`[Watcher][${opt.type}]`, opt);
        }
        lastChangeFiles.add(opt);
        emitter.emit(lastChangeFiles);
      });
      // Return a unsubcribe method
      return () => {
        props.end();
      }
    });
    // Now subscribe to it with debounce
    stream.throttle(config.wait || DEFAULT_WAIT).observe({
      value (value) {
        // The value is actually the accumulated change values
        // we turn it into an array before send
        evt.emit(EVENT_NAME, Array.from(value));
        // Clear it
        lastChangeFiles.clear();
      }
    });
  } catch (e) {
    logutil('fork process crash', e);
  }
  // Exit call
  return (take = true) => {
    if (take) {
      return evt
    }
    try {
      evt.emit('exit');
      props.send('exit');
      if (typeof stream === 'function') {
        stream();
      }
    } catch (e) {
      // Don't let this break the exit call
      console.error(e);
    }
  }
}

// watcher
const debug$8 = getDebug('reload');

/**
 * @v1.5.0 we create our own reload script and remove the old reload.js
 * because it keeps breaking down
 * This new method will call a fork fileWatcher function then pass the event
 * to the client script via socket.io namespace method
 * @param {array} filePaths array of files path to watch
 * @param {object} io socket io instance to create the namespace
 * @param {object} config the config.reload object
 * @return {function} unwatch callback
 */
function reloadGenerator (filePaths, io, config) {
  const watcherCb = watcherGenerator(utils.extend({ filePaths }, config));
  const props = watcherCb(true);
  // First setup the socket io namespace
  // debug('[reload][setup]', 'setup namespace', config.namespace);
  const nsp = io.of(config.namespace);
  nsp.on('connection', (socket) => {
    socket.emit('hello', config.hello);
  });
  props.on(EVENT_NAME, files => {
    debug$8('[reload][change]', config.eventName, files);
    nsp.emit(config.eventName, files);
  });
  // Return a unwatch callback
  return () => {
    if (config.verbose) {
      logutil('[reload][exit]');
    }
    watcherCb(false);
    // Exit the namespace
    const connectedNameSpaceSockets = Object.keys(nsp.connected); // Get Object with Connected SocketIds as properties
    connectedNameSpaceSockets.forEach(socketId => {
      nsp.connected[socketId].disconnect(); // Disconnect Each socket
    });
    nsp.removeAllListeners(); // Remove all Listeners for the event emitter
    delete io.nsps[config.namespace];
  }
}

// break out from render-scripts-middlewares
// for user here
const debug$7 = getDebug('render-scripts');
/**
 * Success output
 * @param {object} ctx koa app
 * @param {string} doc rendered html
 * @return {undefined} nothing
 */
const success = (ctx, doc, otherContentType = false) => {
  ctx.status = 200;
  ctx.type = otherContentType || contentType;
  ctx.length = getDocLen(doc);
  ctx.body = doc;
};

/**
 * Group all the fail call
 * @param {object} ctx koa app
 * @param {object} e Error
 * @param {string} msg to throw
 * @return {undefined} nothing
 */
const failed = (ctx, e, msg) => {
  logutil(msg, e);
  ctx.throw(404, msg);
};

/**
 * @TODO caching the document
 * @NOTE perhaps we could do a in memory cache
 * @param {string} doc html
 * @return {string} html document
 */
const getCacheVer = doc => {
  // debug('getCacheVer', doc)
  return doc
};

/*
put all the templates here as string literal
*/
const cordovaTpl = 'console.log(\'This is fake cordova.js. To be develop further\')';

// move out from the render-scripts-middleware
// if this is enable then return the mapped object
function prepareCordova (config) {
  if (config.cordova !== false) {
    const cordovaTargets = targets$1
      .map(file => ({ ['/' + file]: serveCordova }))
      .reduce((a, b) => Object.assign(a, b), {});
    return cordovaTargets
  }
  return {}
}

const targets$1 = [cordovaJs];
// main method
async function serveCordova (ctx, config) {
  if (ctx.url === '/' + cordovaJs) {
    if (config.cordova === true) {
      success(ctx, cordovaTpl);
      return true
    }
    if (utils.isString(config.cordova)) {
      try {
        success(ctx, await readDocument(config.cordova));
        return true
      } catch (e) {
        failed(ctx, e, config.cordova + ' Not found!');
      }
    }
  }
}

// This is a special qunit helper to replace the external load qunit files to the local serve files
// setup
const projectRoot = process.cwd();
const dir = 'qunit';
const nodeModulesDir = path.join(projectRoot, 'node_modules', dir);
const js = 'qunit.js';
const css = 'qunit.css';
const qunitJs = [dir, js].join('/');
const qunitCss = [dir, css].join('/');

function prepareQunit (config) {
  if (config.qunit !== false) {
    return targets
      .map(file => ({
        ['/' + file]: serveQunit
      }))
      .reduce((a, b) => Object.assign(a, b), {})
  }
  return {}
}

const targets = [qunitJs, qunitCss];
// Main method
async function serveQunit (ctx, config) {
  const found = targets.filter(url => ctx.url === '/' + url);
  if (found.length > 0) {
    try {
      const file = found[0].split('/')[1];
      const target = path.join(nodeModulesDir, dir, file);
      debug$7('qunit target', target);
      const doc = await readDocument(target);
      const contentType = target.indexOf('.css') > -1 ? CSS_CONTENT_TYPE : false;
      success(ctx, doc, contentType);
      return true
    } catch (e) {
      failed(ctx, e, 'search for qunit file failed');
    }
  }
}

/**
 * This will combine debugger and reload client file overwrite in one place
 * there will be just one middleware to handle them
 */
// get where are we
const __dirname$2 = getDirname((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('mastermind.js', document.baseURI).href)));
/**
 * V2.2.0 add addtional config to the socket templates
 */
const prepareSocketClient = (str, config) => {
  return utils.formatStr(str, `, path: '${config.socket.path}'`)
};

/**
 * Get scripts paths
 * @param {object} config the main config object
 * @return {object} parse file paths
 */
const getFeatureScripts = function (config) {
  const socketIoJs = [config.socket.path, 'socket.io.js'].join('');
  // Debugger
  const debuggerPath = config.debugger.namespace;
  const eventName = config.debugger.eventName;
  const debuggerJs = [debuggerPath, config.debugger.js].join('/');
  const stacktraceJsFile = [debuggerPath, stacktraceName].join('/');
  // Reload
  const reloadPath = config.reload.namespace;
  const reloadEventName = config.reload.eventName;
  const reloadJs = [reloadPath, config.reload.js].join('/');
  // Return
  return {
    debuggerPath,
    eventName,
    reloadPath,
    reloadEventName,
    socketIoJs,
    debuggerJs,
    stacktraceJsFile,
    reloadJs
  }
};

/**
 * Find the stack track file
 * @return {string} path to stacktrace file
 */
const searchStacktraceSrc = () => {
  // @NOTE this is problematic
  const stacktraceFile = path.join(
    'stacktrace-js',
    'dist',
    'stacktrace-with-promises-and-json-polyfills.js'
  );
  const projectRoot = path.join(__dirname$2, '..', '..', '..');
  const here = path.resolve('./');
  const fullPath = path.join(projectRoot, 'node_modules', stacktraceFile);
  const libPath = path.join(projectRoot, 'lib', stacktraceFile);
  const searchPaths = [libPath, fullPath, path.join(here, 'node_modules', stacktraceFile)];
  debug$7('searchPaths', searchPaths);
  return searchPaths
    .filter(f => {
      return fs__default["default"].existsSync(f)
    })
    .reduce((first, next) => {
      return next
    }, null)
};

/**
 * Allow user supply overwrite files
 * @param {object} ctx koa
 * @param {object} config options
 * @return {boolean} true has false not
 */
async function hasExtraVirtualOverwrite (ctx, config) {
  const features = [prepareCordova, prepareQunit]
    .map(fn => fn(config))
    .reduce((a, b) => Object.assign(a, b), {});
  const key = ctx.url;
  if (features[key]) {
    return await features[key](ctx, config)
  }
  return false
}

/**
 * This become a standalone middleware and always going to inject to the app
 * @param {object} config the main config object
 * @return {undefined} nothing
 * @api public
 */
function renderScriptsMiddleware (config) {
  const {
    debuggerPath,
    eventName,
    reloadPath,
    reloadEventName,
    debuggerJs,
    stacktraceJsFile,
    reloadJs
  } = getFeatureScripts(config);
  // Export middleware
  return async function middleware (ctx, next) {
    await next();
    // Only catch certain methods
    if (ctx.method === 'GET') {
      const url = ctx.url;
      // debug('render-scripts-middleware', url)
      switch (url) {
        // Without the {} will get a Unexpected lexical declaration in case block  no-case-declarations
        case dummyJs: {
          debug$7('catch script', dummyJs);
          const body = await Promise.resolve('console.info(\'SERVER_IO_CORE\', true)');
          return success(ctx, body)
        }
        case reloadJs: {
          try {
            const body = await Promise.resolve(
              prepareSocketClient(reloadTpl, config)
            ).then(data => {
              const clientFileFn = template__default["default"](data);
              const connectionOptions = getSocketConnectionConfig(config);
              return getCacheVer(
                clientFileFn({
                  reloadNamespace: reloadPath,
                  eventName: reloadEventName,
                  displayLog: config.reload.displayLog,
                  connectionOptions
                })
              )
            });
            success(ctx, body);
          } catch (e) {
            failed(ctx, e, 'Error reading io-reload-client file');
          }
          return // Terminate it
        }
        case stacktraceJsFile: {
          try {
            const body = await readDocument(searchStacktraceSrc());
            success(ctx, body);
          } catch (e) {
            failed(ctx, e, 'Error reading stacktrace source file!');
          }
          return // Terminate it
        }
        case debuggerJs: {
          try {
            const body = await Promise.resolve(
              prepareSocketClient(debuggerClientTpl, config)
            ).then(data => {
              // If they want to ping the server back on init
              const ping =
                typeof config.debugger.client === 'object' && config.debugger.client.ping
                  ? 'true'
                  : 'false';
              const serveDataFn = template__default["default"](data);
              const connectionOptions = getSocketConnectionConfig(config);
              return getCacheVer(
                serveDataFn({
                  debuggerPath,
                  eventName,
                  ping,
                  connectionOptions,
                  consoleDebug: config.debugger.consoleDebug
                })
              )
            });
            return success(ctx, body)
          } catch (e) {
            failed(ctx, e, 'Error reading io-debugger-client file');
          }
          return // Terminate it
        }
        default:
          // @2018-08-20 started @2022-06-22 additional features added
          if ((await hasExtraVirtualOverwrite(ctx, config)) === true) {
            debug$7('catch hasExtraVirtualOverwrite');
          }
      }
    }
  }
}

// Inject dependencies (CSS,js) files etc

const debug$6 = getDebug('files-inject');

/**
 * combine the two tagging method together
 * @param {string} type css / js
 * @param {string} file file to insert
 * @param {string} [ignorePath=''] optional to ignore the path
 * @return {string} tagged version
 */
const tagFile = (type, file, ignorePath) => {
  if (ignorePath) {
    if (ignorePath) {
      file = file.replace(ignorePath, '');
    }
  }
  if (type === 'css') {
    return `<link rel="stylesheet" href="${file}" />`
  }
  return `<script type="text/javascript" src="${file}" defer></script>`
};

/**
 * @param {array} files to wrap with tag
 * @param {string} ignorePath to strip out
 * @return {string} conccat them all
 */
const tagJs = (files, ignorePath) => {
  return files.map(file => tagFile('js', file, ignorePath)).join('\r\n')
};

/**
 * @param {string} source to process
 * @return {array} result
 */
const processFiles = source => {
  let files = [];
  if (source.indexOf('*') > -1) {
    files = files.concat(glob__default["default"].sync(source));
  } else {
    files = files.concat([source]);
  }
  return files
};

/**
 * @param {strimg} name file
 * @return {boolean} true found css
 */
const isCss = name => {
  return name.toLowerCase().substr(-3) === 'css'
};

/**
 * @param {string} name file
 * @return {boolean} true found js
 */
const isJs = name => {
  return name.toLowerCase().substr(-2) === 'js'
};

/**
 *
 * @param {object} source from config
 * @param {string} key head or body
 * @return {array} always array even empty
 */
const extractFromSource = (source, key) => {
  if (source[key]) {
    const s = source[key];
    return Array.isArray(s) ? s : [s]
  }
  return []
};

/**
 * @param {object} config the inject configuration object
 * @return {object} js<Array> css<Array>
 */
const getSource = config => {
  let js = [];
  let css = [];
  const { target, source } = config;
  // If they pass a non array then it will get ignore!
  if (source && Array.isArray(source) && source.length) {
    // Processing the object
    for (let i = 0, len = source.length; i < len; ++i) {
      const s = source[i];
      if (isCss(s)) {
        css = css.concat(processFiles(s));
      } else if (isJs(s)) {
        js = js.concat(processFiles(s));
      }
    }
  }

  if (
    (target.head && Array.isArray(target.head) && target.head.length) ||
    (target.body && Array.isArray(target.body) && target.body.length)
  ) {
    // Expect head of bottom!
    // it's pretty simple actually those with head in css
    // those with body in js and that's it
    css = css.concat(extractFromSource(target, 'head'));
    js = js.concat(extractFromSource(target, 'body'));
  }
  return { js, css }
};

/**
 * Combine function
 * @param {string} file to target
 * @param {string} ignorePath path to ignore and strip out
 * @return {string} tagged file
 */
function checkAndTagFile (file, ignorePath) {
  if (isJs(file)) {
    return tagFile('js', file, ignorePath)
  }
  if (isCss(file)) {
    return tagFile('css', file, ignorePath)
  }
  throw new Error('It must be js or css file!')
}

/**
 * New option in 1.0.10 pass the processor function
 * to run through the js before we pass to the tagging
 * @param {object} config configuration
 * @param {array} js the list of js files
 * @return {array} the list of js files
 */
function getProcessor (config, js) {
  const { processor } = config;
  if (processor && typeof processor === 'function') {
    const result = Reflect.apply(processor, null, [js]);
    if (!Array.isArray(result)) {
      throw new Error('Expect your processor to return an array of javascript files!')
    }
    return result
  }

  return js
}

/**
 * Prepare the css / js array to inject
 * @param {object} config the config.inject properties
 * @return {object} js<string> css<string>
 */
const getFilesToInject = function (config) {
  // @2018-05-07 disbale this check because we couldn't get the fileanme from the middleware
  // const target = getTarget(config.target);
  const { js, css } = getSource(config);
  // Const check = target && (js || css);
  if (!js.length && !css.length) {
    // Both should have at least one have properties!
    if (config.enable) {
      // Display an error inline here
      const msg = '[inject] Configuration is incorrect for injector to work!';
      debug$6('injector error', msg);
      logutil(msg, config);
    }
    return { js: '', css: '' }
  }
  const br = '\r\n';
  return {
    js: getProcessor(config, js)
      .map(j => checkAndTagFile(j, config.ignorePath))
      .join(br) + br,
    css: css.map(c => checkAndTagFile(c, config.ignorePath)).join(br) + br
  }
};

/**
 * @TODO add the before / after parameter
 * @TODO add insertBefore / insertAfter in to config
 * @param {string} body rendered html
 * @param {array} jsTags of tag javascripts
 * @param {array} cssTags of tag CSS
 * @param {boolean} before true new configuration option
 * @return {string} overwritten HTML
 */
const injectToHtml = (body, jsTags, cssTags, before = true) => {
  const html = utils.isString(body) ? body : body.toString('utf8');
  const $ = cheerio__default["default"].load(html);
  // @2018-08-13 add check if there is existing javascript tags
  const $scripts = $('body script').toArray();
  if (jsTags) {
    if ($scripts.length) {
      if (before) {
        $($scripts[0]).before(jsTags);
      } else {
        $($scripts[$scripts.length - 1]).after(jsTags);
      }
    } else {
      $('body').append(jsTags);
    }
  }
  if (cssTags) {
    $('head').append(cssTags);
  }
  return $.html()
};

/**
 * 1.3.0 add replace option, expecting keys are
 * - target: a string tag
 * - replace: a string to replace with
 * - file (optional): we will try to read the file and use the content to replace it
 * - all (optional): replace every single one or not (false by default)
 * @param {string} html the html document
 * @param {array} replace array of the above mentioned object
 * @return {string} the replaced html document
 */
const replaceContent = (html, replace) => {
  if (Array.isArray(replace) && replace.length > 0) {
    return replace.reduce((text, opt) => {
      const { target, str, file, all } = opt;
      const g = all !== false; // Unless set otherwise always replace global
      if (target) {
        let toReplace = '';
        if (file && fsx__default["default"].existsSync(file)) {
          toReplace = fsx__default["default"].readFileSync(file, { encoding: 'utf8' });
        } else if (str) {
          toReplace = str;
        }
        if (g) {
          const regex = new RegExp(target, 'g');
          return text.replace(regex, toReplace)
        }
        return text.replace(target, replace)
      }
      return text
    }, html)
  }
  return html
};

// Script injector middleware
const debug$5 = getDebug('inject');

/**
 * Breaking out the read function for the aynsc operation
 * @param {string} p path to file
 * @param {string} js tags
 * @param {string} css tags
 * @param {boolean} insertBefore from config
 * @return {object} promise resolve string
 */
function getHtmlDocument (p, js, css, insertBefore) {
  return readDocument(p).then(data => {
    if (data) {
      return injectToHtml(data, js, css, insertBefore)
    }
    return data
  })
}

/**
 * Search the array of documents until it find the right one otherwise just
 * throw it
 * @param {object} params group together to get around the linting crap
 * @param {array} params.webroot dir
 * @param {string} params.p html
 * @param {string} params.js tags
 * @param {string} params.css tags
 * @param {boolean} params.insertBefore from config
 * @return {object} throw on not found
 */
function searchHtmlDocuments ({ webroot, p, js, css, insertBefore }) {
  const file = searchFileFromFiles([p].concat(webroot.map(dir => path.join(dir, p))));
  if (file) {
    return getHtmlDocument(file, js, css, insertBefore)
  }
  throw new Error(`File ${p} not found from ${webroot}`)
}

/**
 * @param {object} config the main config
 * @return {function} middleware
 * @api public
 */
function scriptsInjectorMiddleware (config) {
  let scripts = [];
  const features = {
    debugger: config.debugger.enable,
    reload: config.reload.enable,
    inject: config.inject.enable
  };
  const {
    socketIoJs,
    debuggerJs,
    stacktraceJsFile,
    reloadJs
  } = getFeatureScripts(
    config
  );
  if (features.debugger || features.reload) {
    scripts.push(socketIoJs);
  }
  if (features.debugger) {
    // @TODO if they change the debugger config
    // we might have to do additional checks here just in case
    scripts = scripts.concat([stacktraceJsFile, debuggerJs]);
  }
  if (features.reload) {
    // @2018-05-14 using our new reload method
    scripts.push(reloadJs);
  }
  const files = tagJs(scripts);
  // Next we add the fileInjector function here
  const { js, css } = getFilesToInject(config.inject);
  if (config.inject.enable) {
    debug$5('getFilesToInject', js, css);
  }
  const contentType = 'text/html';
  // Export the middleware
  return async function middleware (ctx, next) {
    if (ctx.method === 'GET') {
      if (headerParser(ctx.request, contentType)) {
        const isHtmlDoc =
          ctx.path === '/'
            ? searchIndexFile(config)
            : isHtmlFile(ctx.path)
              ? ctx.path
              : false;
        if (isHtmlDoc) {
          try {
            debug$5('use overwrite', ctx.url, ctx.path);
            const doc = await searchHtmlDocuments({
              webroot: config.webroot,
              p: isHtmlDoc,
              js: utils.compact([files, js]).join(''),
              css: css,
              insertBefore: config.inject.insertBefore
            })
            // @1.3.0 chain to the replace
              .then(doc => replaceContent(doc, config.inject.replace));
            /* eslint require-atomic-updates: off */
            ctx.status = 200;
            ctx.type = contentType + '; charset=utf8';
            ctx.length = getDocLen(doc);
            ctx.body = doc;
          } catch (err) {
            debug$5('get document error', err);
            ctx.throw(404, '[injector] Html file not found!');
          }
          return
        }
      }
    }
    await next();
  }
}

// Favicon middleware
// convert our stock icon to base64 string
const base64icon = 'AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAABENi//PDAr/zAlIf9JQkL/ZGFi/3BsbP+gpKf/nqew/3l/j/9QT2//b3KQ/42Sof+cnJ7/8/Pz//7+/v/R0tL/Rjcw/zotKf8tIx//OjIx/35+f/+DhIX/hYmO/32Ai/9RUXD/cniS/6Krtv+gpqv/s7Oz///////p6er/0dLR/0EyK/84Kyb/LiMh/3h2dv+jqK3/maKs/6SqsP+ipq7/jZKe/3+HkP9/h5X/i5Oe/62wsf/k5ub/zs7O/7CwsP9ENi//NCYh/2RfX/+foqX/pKqw/5Scp/+ut73/rLnD/5mksv+BiZf/XmNw/2xzf/94fYX/kJOW/3JvdP+pqav/WVBL/zwwLP+UlJb/q7C1/5qiq/90fYv/bXaF/4ONnP9pcI3/laa3/4aTov9dYm3/VFVd/1lYXv9kYGv/8fLy/11XVP9TTUr/lJie/9LZ3v+iq7X/P0VU/3R/kP+IlaT/YWyD/3qKm/+Fl6n/bHWC/2RnbP9KRlP/s7S5//////9YT0n/b257/6+1xf/K0tj/x9DX/4GNnP+Dk6X/hJao/2Bte/9mc4T/bnyO/2pxfP9XWWL/ZmZx//f7+v//////Ylla/6Orwf+zvcz/kpuo/5mksf+DjZr/UVdh/2p5i/9canr/bn2O/11lcv9udYH/U1Zl/7/Hy////////f39/15UU/+JipH/YF9l/zcyNP9HRkf/WFtf/2Foc/96ipv/gZOk/11ldP9kbHn/cYCP/4SMmf/5/Pz///////3+/v9DNjD/PTAs/zQqJv8sJSX/LSw3/zEwOf9cX2X/lqa3/3GBk/9ugZH/dI2f/4GVpf/X4eX///////3+/v/0+vr/OSkk/zQnI/8/Oj//VVx5/11nlf9KUID/P0Zk/3V9iP+Op7z/gZ+x/3mUpv+itL//9/39///////y+fr/6/X2/1RJRv+KiZD/hZCv/3B2nv9ra5r/UU+C/1Raiv9zhJ7/jam5/4unt/+KobD/wtHZ///////2+fr/6PL0/+v09f/s9vj/6e/7/3N6nv9XVnT/YF+E/1FPdv9FRWr/Z3OZ/6K5yP+as8L/l6+9/+Dr8P/9////5O/y/+bw8v/q9PT/7/b4/+Hk8v9nbJH/bHGW/2Rok/9QUHr/VVmD/19olP++ytf/z93k/8HS3P/u9vj/5u/y/9/r7v/k7vD/5vDw/+rt+f/b3u3/ZmuT/15bhf91dJv/YF6G/1JRff9fZ5H/vMnX/9nl6v/f6/H/5O/y/9rm6v/d6ev/3+ns/+Tu7//t7/z/vMDT/1RVef9cWHf/mJzC/2lqlP9JRmT/WV16/7C8xv/c6e7/1+Pq/9nl6v/a5en/2uXo/93o7P/I3u3/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';

// Main - now its all name export
function faviconMiddlewareGenerator (config) {
  const icon = config.favicon && fsx__default["default"].existsSync(path.resolve(config.favicon))
    ? fsx__default["default"].readFileSync(config.favicon)
    : Buffer.from(base64icon, 'base64');
  const maxAge = config.maxAge === null
    ? MAX_AGE
    : Math.min(Math.max(0, config.maxAge), MAX_MAX_AGE);
  const cacheControl = `public, max-age=${(maxAge / 1000) | 0}`;

  return async function faviconMiddleware (ctx, next) {
    if (ctx.method === 'GET' && ctx.path === '/favicon.ico') {
      // @TODO should search if the document root has a favicon.ico first
      ctx.status = 200;
      ctx.set('Cache-Control', cacheControl);
      ctx.type = 'image/x-icon';
      ctx.body = icon;
    }
    await next();
  }
}

/**
 * this register all the required middlewares
 */
// main
function registerMiddlewares (app, config) {
  let addDebugger = false;
  const addReload = config.reload.enable;
  let middlewares = [bodyParser__default["default"]()];
  if (config.favicon !== false) {
    middlewares.push(faviconMiddlewareGenerator(config));
  }
  // Make sure the namespace is correct first
  if (config.debugger.enable) {
    const namespace = config.debugger.namespace;
    if (!namespace) {
      config.debugger.namespace = '/debugger-io';
    } else if (namespace.substr(0, 1) !== '/') {
      config.debugger.namespace = '/' + namespace;
    }
    addDebugger = config.debugger.client !== false;
  }
  // Live reload and inject debugger
  // This part inject the scripts into the html files
  if (addReload || addDebugger) {
    middlewares.push(renderScriptsMiddleware(config));
  }
  // @BUG the injector interfere with the normal operation
  if (addReload || addDebugger || config.inject.enable) {
    middlewares.push(scriptsInjectorMiddleware(config));
  }
  // Extra middlewares pass directly from config
  if (Array.isArray(config.middlewares)) {
    middlewares = middlewares.concat(config.middlewares);
  } else {
    middlewares.push(config.middlewares);
  }
  const ctn = middlewares.length;
  // Now inject the middlewares
  if (ctn) {
    // But the problem with Koa is the ctx.state is not falling through
    // all the way, so we might need to add the middleware in stack
    // with app.use.apply(app, [middlewares_sub_array]);
    middlewares.forEach(m => app.use(m));
  }
  // Just return the number of middlewares
  return ctn
}

// the combine startup server now is here
const debug$4 = getDebug('createInternalServer');
// main
async function createInternalServer (config) {
  let io = null;
  let socketIsEnabled = false;
  const app = new Koa__default["default"]();
  const namespaceInUsed = [];
  const unwatchFn = [];
  const {
    webserver,
    startInternal,
    stopInternal
  } = webserverGenerator(app, config);
  // 2018-08-17 unless specify the socket will always be enable
  // 2019-05-01 if we need to proxy out the ws then this socket can not start
  // because we have to hijack it at the higher server.on.upgrade event
  if (
    config.socket.enable ||
    config.reload.enable ||
    (config.debugger.enable && config.debugger.server === true)
  ) {
    socketIsEnabled = true;
    io = socketIoGenerator(webserver, config);
  }
  // @TODO we need to combine the two socket server into one
  // 1. check if those modules that require a socket server is needed
  // 2. generate a socket server, then passing the instance back to
  // their respective constructors
  // Run the watcher, return an unwatch function
  if (config.reload.enable) {
    // Limiting the config options
    unwatchFn.push(reloadGenerator(config.webroot, io, config.reload));
    namespaceInUsed.push(config.reload.namespace);
  }
  // Debugger server start
  if (config.debugger.enable && config.debugger.server === true) {
    unwatchFn.push(debuggerServer(config, io));
    namespaceInUsed.push(config.debugger.namespace);
  }
  // Enable the injectors here, if socket server is enable that means
  // The injector related function need to be activated
  registerMiddlewares(app, config);
  // @TODO should this return a promise so we know if it works or not?
  // Keep the init of the static serve until the last call
  serverStatic(app, config);
  // Call back on close
  webserver.on('close', () => {
    debug$4('webserver on close and clean up');
    // MockServerInstance.close();
    if (io && io.server && io.server.close) {
      io.server.close();
    }
    unwatchFn.forEach(fn => fn());
  });
  // V.2 return a whole bunch of props for use later
  return { webserver, app, startInternal, stopInternal, io, socketIsEnabled }
}

/*
This will be the front that facing the public
Then we proxy the connection to the service behind it,
This server will get call last in the stack - waiting for other service started first
*/
const debug$3 = getDebug('publix-proxy-server');
// Main - async is not right too, this should return an observable
async function createPublicProxyServer (config) {
  // prepare
  const publicPort = config.port;
  const publicHost = Array.isArray(config.host) ? config.host[0] : config.host;
  const internalPort = config[INTERNAL_PORT];
  const internalHost = `http://${DEFAULT_HOST}:${internalPort}`;
  // proxy to internal
  const proxy = new HttpProxy__default["default"]({ target: internalHost, ws: true });
  debug$3('proxy point to ', internalHost);
  // prepare the other proxies
  const { httpProxies, wsProxies } = prepareProxiesConfig(config);
  // create public server
  const publicServer = http__default["default"].createServer((req, res) => {
    const { pathname } = url__default["default"].parse(req.url);
    if (httpProxies[pathname]) {
      debug$3('http proxy catched', pathname);
      return httpProxies[pathname].web(req, res)
    }
    proxy.web(req, res);
  }).on('upgrade', (req, socket, head) => {
    const { pathname } = url__default["default"].parse(req.url);
    debug$3('ws pathname', pathname);
    if (wsProxies[pathname]) {
      debug$3('ws proxy catched', pathname);
      return wsProxies[pathname].ws(req, socket, head)
    }
    // default proxy catch anything
    proxy.ws(req, socket, head);
  });

  return {
    startPublic: async () => {
      return new Promise(resolve => {
        publicServer.listen(
          publicPort,
          publicHost,
          () => {
            const info = updateInfo(publicServer.address());
            const msg = `${info.hostname}:${info.port} --> ${internalHost}`;
            debug$3('publicServer', info, msg);
            logutil(msg);
            resolve(info);
          }
        );
      })
    },
    stopPublic: () => {
      publicServer.close();
    }
  }
}

// just move the address to hostname
function updateInfo (info) {
  for (const key in info) {
    if (key === 'address') {
      info.hostname = info[key];
    }
  }
  return info
}

// prepare the user supplied proxies
function prepareProxiesConfig ({ proxies }) {
  const httpProxies = {};
  const wsProxies = {};
  proxies.forEach(proxyConfig => {
    debug$3('proxyConfig', proxyConfig);
    const { type } = proxyConfig;
    if (type === 'http') {
      const { context, target } = proxyConfig;
      if (context && target) {
        httpProxies[context] = new HttpProxy__default["default"]({ target });
      } else {
        debug$3('mis-config http proxy', proxyConfig);
      }
    } else if (type === 'ws') {
      const { context, target } = proxyConfig;
      if (context && target) {
        wsProxies[context] = new HttpProxy__default["default"]({ target, ws: true });
      } else {
        debug$3('mis-config ws proxy', proxyConfig);
      }
    } else {
      debug$3('unknown proxy config', proxyConfig);
    }
  });
  debug$3('proxies http:', objLength(httpProxies), 'ws:', objLength(wsProxies));
  return { httpProxies, wsProxies }
}

// V.2 using ESM
const debug$2 = getDebug('main');
// Main
async function serverIoCore$1 (config = {}) {
  // v2.3.0 we need to retain the old port number and pass here again
  let overwritePort = null;
  // first start our internal
  const {
    webserver,
    app,
    io,
    startInternal,
    stopInternal,
    socketIsEnabled
  } = await createInternalServer(config);
  // first just store the stop call in here
  const allStop = [stopInternal];
  const configCb = config.callback;
  // here we combine several start callstopInternal togethear
  const startAllFn = async () => {
    const port0 = await startInternal();
    debug$2(`Internal server started on ${port0}`);
    config[INTERNAL_PORT] = port0;
    config.socketIsEnabled = socketIsEnabled;
    if (config[MASTER_MIND].enable === true && overwritePort !== null) {
      config.port = overwritePort;
    }
    const {
      startPublic,
      stopPublic
    } = await createPublicProxyServer(config);
    allStop.push(stopPublic);
    // this callback is from config
    if (typeof configCb === 'function') {
      Reflect.apply(configCb, null, [config]);
    }
    const { port, address } = await startPublic();
    if (config[MASTER_MIND].enable === true) {
      overwritePort = port;
    }
    debug$2('Public proxy server started on ', address, port);
    config.port = port; // swap the port number because it could be a dynamic port now
    openInBrowser(config);
    startMsg(config);
    // create a table display
    return [port, port0, address]
  };
  // stop all
  const stopAllFn = () => {
    allStop.forEach((stop, i) => {
      debug$2('stop server', i);
      stop();
    });
  };
  // now we deal with the autoStart here
  if (config[AUTO_START] === true) {
    await startAllFn();
  }
  // return all the references
  return {
    config, // 2.3.0 return the config for master mind
    webserver,
    app,
    io,
    start: startAllFn,
    stop: stopAllFn
  }
}

// serverIoCore main

const debug$1 = getDebug('index');
const __dirname$1 = getDirname((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('mastermind.js', document.baseURI).href)));

/**
 * Main entry point for server-io-core
 * @2.4.0 change the name export BREAKING
 * @param {object} config options
 * @return {object} http server instance
 * @api public
 */
async function serverIoCore (config = {}) {
  const configCopy = utils.merge({}, config);

  const opts = createConfiguration(configCopy);
  opts.webroot = utils.toArray(opts.webroot).map(dir => path.resolve(dir));
  const { version } = getPkgInfo(path.join(__dirname$1, 'package.json'));
  opts.version = version;

  opts.__processed__ = true;

  debug$1('user supplied config', configCopy);
  debug$1('options', util.inspect(opts, false, null, true));

  return await serverIoCore$1(opts)
}

// this is a pupeteer to control the serverIoCore server start restart etc
const debug = getDebug('mastermind');
// main
async function masterMind (options = {}) {
  if (!options[MASTER_MIND]) {
    options[MASTER_MIND] = true; // enable it
  }
  options[AUTO_START] = false; // it must be false
  const {
    config,
    // webserver,
    // app,
    io,
    start,
    stop
  } = await serverIoCore(options);
  // We are re-using the io
  // one of the upside is even the server shutdown and re-start
  // the client will re-try until it reconnect, then we can
  // continue the operation
  if (config === false) {
    throw new Error('Mis-config master mind!')
  }
  const { namespace, client } = config[MASTER_MIND];
  const nsp = io.of(namespace);
  let result = await start();
  debug('started info', result);
  let started = true;
  // start listening
  nsp.on('connection', socket => {
    debug('client connection');
    socket.on('status', (callback) => {
      callback(started);
    });
    socket.on('start', async (callback) => {
      if (!started) {
        result = await start();
        started = true;
      }
      callback(result);
      logutil(`masterMind${' already'} start on `, result[2], result[0]);
    });
    socket.on('stop', () => {
      if (started) {
        stop();
        started = false;
        logutil('masterMind stopped');
      }
    });
    socket.on('restart', (callback) => {
      if (started) {
        stop();
      }
      // just pause a bit
      setTimeout(async () => {
        result = await start();
        started = true;
        callback(result);
        logutil('masterMind restarted', result[2], result[0]);
      }, 100);
    });
  });
  const url = `http://localhost:${result[0]}`;
  const clientConfig = [`${url}${namespace}`, { path: config.socket.path, transports: TRANSPORT }];
  debug(clientConfig);
  // if client is false then just return info to construct the client themselves
  return client
    ? Reflect.apply(WSClient, null, clientConfig)
    : clientConfig
}

exports.masterMind = masterMind;
