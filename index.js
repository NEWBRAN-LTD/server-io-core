'use strict';

var path = require('node:path');
var util = require('node:util');
var fs = require('node:fs');
var os = require('node:os');
var url = require('node:url');
var log = require('fancy-log');
var template = require('lodash.template');
var process$1 = require('process');
var fsx = require('fs-extra');
var debugFn = require('debug');
var open = require('open');
var Koa = require('koa');
var http = require('node:http');
var https = require('node:https');
var send = require('koa-send');
var socket_ioClient = require('socket.io-client');
var socket_io = require('socket.io');
var EventEmitter = require('node:events');
var node_child_process = require('node:child_process');
var kefir = require('kefir');
var bodyParser = require('koa-bodyparser');
var cheerio = require('cheerio');
var glob = require('glob');
var HttpProxy = require('http-proxy');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var util__default = /*#__PURE__*/_interopDefaultLegacy(util);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var os__default = /*#__PURE__*/_interopDefaultLegacy(os);
var url__default = /*#__PURE__*/_interopDefaultLegacy(url);
var log__default = /*#__PURE__*/_interopDefaultLegacy(log);
var template__default = /*#__PURE__*/_interopDefaultLegacy(template);
var fsx__default = /*#__PURE__*/_interopDefaultLegacy(fsx);
var debugFn__default = /*#__PURE__*/_interopDefaultLegacy(debugFn);
var open__default = /*#__PURE__*/_interopDefaultLegacy(open);
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

/** import.meta.url */
function getDirname (url$1) {
  const __filename = url.fileURLToPath(url$1);
  return path__default["default"].dirname(__filename)
}

/** should get rip of all the lodash crap long time ago */

const isObject = (item) => {
  return (item && typeof item === 'object' && !Array.isArray(item))
};

const mergeDeep = (target, ...sources) => {
  if (!sources.length) return target
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, {
            [key]: {}
          });
        }
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, {
          [key]: source[key]
        });
      }
    }
  }
  return mergeDeep(target, ...sources)
};
// just alias it
const merge = mergeDeep;

const compact = arr => arr.filter(Boolean);

function extend (...args) {
  return Reflect.apply(Object.assign, null, args)
}

function forEach (obj, cb) {
  let i = 0;
  for (const name in obj) {
    cb(obj[name], i);
    ++i;
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
 * Make sure the supply argument is an array
 */
const toArray = param => {
  if (param) {
    return Array.isArray(param) ? param : [param]
  }
  return []
};

/**
 * @param {mixed} opt
 * @return {boolean} result
 */
const isString = opt => {
  return typeof opt === 'string'
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
  const webroots = toArray(webroot);
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

// Move from the app.js to here
const __dirname$5 = getDirname((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('index.js', document.baseURI).href)));
path.join(__dirname$5, '..', '..');
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

// main
function getDebug (key) {
  return debugFn__default["default"]([DEBUG_MAIN_KEY, key].join(':'))
}

// Open in browser

const debug$b = getDebug('open');

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
    debug$b('[open configuration]', config.open);
    let multiple = false;
    const args = [constructUrl(config)];
    // If there is just the true option then we need to construct the link
    if (config.open.browser) {
      if (isString(config.open.browser)) {
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
      debug$b('[open]', args);
      Reflect.apply(open__default["default"], open__default["default"], args);
    } else {
      // Open multiple browsers at once
      multiple.forEach(browser => {
        debug$b('[open]', browser, args);
        Reflect.apply(open__default["default"], open__default["default"], args.concat([browser]));
      });
    }
    return true
  } catch (e) {
    debug$b('[open] error:', e);
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

/**
 * Port from the original gulp-webserver
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
          [objKey]: merge({}, options[objKey], { [propKey]: toArray(value) })
        }
      }

      if (options[key]) {
        return { [key]: toArray(options[key]) }
      }

      return { [key]: [] }
    })
    .reduce((next, last) => {
      return extend(next, last)
    }, options)
};

/**
 * Make sure we get the config in an array
 * @param {object} config for wsProxy
 * @return {mixed} false on failed!
 */
const extractArrayProps = config => {
  if (typeof config === 'object' && config.target && config.enable !== false) {
    return toArray(config.target)
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
 * @return {object} the corrected config object
 */
const handleSpecialCase = (key, config) => {
  if (key === WS_PROXY) {
    const target = extractArrayProps(config);
    if (target !== false) {
      return {
        enable: true,
        target: target
      }
    }
  }
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
  const originalOptions = merge({}, options);
  const originalDefaults = merge({}, defaults);
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
  const config = merge({}, defaults, tmpProp);
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
    const specialCase = handleSpecialCase(prop, config[prop]);
    if (specialCase !== false) {
      config[prop] = specialCase;
    } else if (config[prop] === true) {
      config[prop] = merge({}, originalDefaults[prop]);
      config[prop].enable = true;
    } else if (originalOptions[prop] && Object.keys(originalOptions[prop]).length) {
      // If the user has provided some property
      // Then we add the enable here for the App to use
      config[prop].enable = true;
    } else if (config[prop] === false) {
      config[prop] = merge({}, originalDefaults[prop], { enable: false });
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
const debug$a = getDebug('static-serve');
/**
 * Customize version of koa-static
 * @param {object} app the Koa instance
 * @param {object} config full options
 * @return {function} to call
 * @api public
 */
function serverStatic (app, config) {
  const dirs = toArray(config.webroot);
  const opts = { defer: true };
  if (config.index) {
    opts.index = config.index;
  }
  // V.2 we just run through it
  dirs.forEach(dir => {
    app.use(serve(dir, opts));
  });
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
            debug$a('Unknown error', err);
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

// just wrapper to socket.io

class WSServer extends socket_io.Server {}

const WSClient = (url) => socket_ioClient.io(url, {
  transports: ['websocket']
});

// V1.0.2
// main
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
this is the new style
import io from "socket.io-client";

const socket = io();

// or, more explicit version
import { Manager } from "socket.io-client";

const manager = new Manager("https://example.com");
const socket = manager.socket("/");
*/

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
  let socketConfig = ['websocket'];
  // if we want to use different protocol
  if (config.socket.socketOnly &&
    config.socket.transportConfig &&
    Array.isArray(config.socket.transportConfig)
  ) {
    socketConfig = config.socket.transportConfig;
  }
  // Need to take this constructor out and re-use with the reload
  const io = new WSServer(server, { transports: socketConfig });
  if (Array.isArray(config.namespace) && config.namespace.length) {
    socketCb(io, config.namespace);
  }
  // Export it again
  return io
}

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
  if (isString(_msg)) {
    rows.push(['MESSAGE:', e.msg].join(' '));
  } else {
    let toShow;
    const msgToArr = isString(_msg) ? parseObj(_msg) : _msg;
    if (Array.isArray(msgToArr)) {
      rows.push('MESSAGE(S):');
      msgToArr.forEach(a => {
        if (typeof a === 'object') {
          rows.push(lb);
          let rowCtn = 1;
          forEach(a, (v, k) => {
            if (v) {
              toShow = isObject(v) ? util__default["default"].inspect(v, false, null) : v;
              rows.push([rowCtn + ':', toShow].join(' '));
              ++rowCtn;
            }
          });
        } else {
          rows.push(a);
        }
      });
      rows.push([lb, 'END'].join(' '));
    } else if (isObject(_msg)) {
      rows.push(lb);
      forEach(_msg, (v, k) => {
        rows.push([k + ':', v].join(' '));
      });
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
const debug$9 = getDebug('debugger');

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
        debug$9('emit internal error', e);
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

/**
 * This file will only get call from the main setup process as a fork process
 * And communicate back via the subprocess.send
 */
// setup
const __dirname$4 = getDirname((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('index.js', document.baseURI).href)));
const watcherFile = path.join(__dirname$4, 'fork.mjs');
const debug$8 = getDebug('watchers');
const lastChangeFiles = new Set();
class WatcherCls extends EventEmitter__default["default"] {}

// Main export
// we now return a function for stopping it
function watcher (config) {
  const evt = new WatcherCls();
  const props = node_child_process.fork(watcherFile);
  let stream;
  try {
    props.send({ type: 'start', config });
    debug$8('[Watcher][start]', config.filePaths);
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
const debug$7 = getDebug('reload');
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
function reload (filePaths, io, config) {
  const watcherCb = watcher(extend({ filePaths }, config));
  const props = watcherCb(true);
  // First setup the socket io namespace
  // debug('[reload][setup]', 'setup namespace', config.namespace);
  const nsp = io.of(config.namespace);
  nsp.on('connection', (socket) => {
    socket.emit('hello', config.hello);
  });
  props.on(EVENT_NAME, files => {
    debug$7('[reload][change]', config.eventName, files);
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
const debug$6 = getDebug('render-scripts');
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

// move out from the render-scripts-middleware
const __dirname$3 = getDirname((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('index.js', document.baseURI).href)));
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
      const doc = await readDocument(path.join(__dirname$3, 'cordova.js.tpl'));
      success(ctx, doc);
      return true
    }
    if (isString(config.cordova)) {
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
      debug$6('qunit target', target);
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
const __dirname$2 = getDirname((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('index.js', document.baseURI).href)));
/**
 * Get scripts paths
 * @param {object} config the main config object
 * @return {object} parse file paths
 */
const getFeatureScripts = function (config) {
  // @TODO this will be replace with ws next
  const socketIoJs = '/socket.io/socket.io.js';
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
    'node_modules',
    'stacktrace-js',
    'dist',
    'stacktrace-with-promises-and-json-polyfills.js'
  );
  return [path.join(__dirname$2, '..', '..', '..', stacktraceFile), stacktraceFile]
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
          debug$6('catch script', dummyJs);
          const body = await Promise.resolve('console.info(\'SERVER_IO_CORE\', true)');
          return success(ctx, body)
        }
        case reloadJs: {
          try {
            const body = await readDocument(
              path.join(__dirname$2, '..', 'reload', 'reload.tpl')
            ).then(data => {
              const clientFileFn = template__default["default"](data.toString());
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
            const body = await readDocument(
              path.join(__dirname$2, '..', 'debugger', 'client.tpl')
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
            debug$6('catch hasExtraVirtualOverwrite');
          }
      }
    }
  }
}

// Inject dependencies (CSS,js) files etc

const debug$5 = getDebug('files-inject');

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
      debug$5('injector error', msg);
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
  const html = isString(body) ? body : body.toString('utf8');
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
const debug$4 = getDebug('inject');

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
    debug$4('getFilesToInject', js, css);
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
            debug$4('use overwrite', ctx.url, ctx.path);
            const doc = await searchHtmlDocuments({
              webroot: config.webroot,
              p: isHtmlDoc,
              js: compact([files, js]).join(''),
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
            debug$4('get document error', err);
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
// Main - now its all name export
function faviconMiddlewareGenerator (config) {
  let icon;
  const __dirname = getDirname((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('index.js', document.baseURI).href)));
  const filePath = config.favicon && fsx__default["default"].existsSync(path.resolve(config.favicon))
    ? config.favicon
    : path.join(__dirname, 'favicon.ico');
  const maxAge = config.maxAge === null
    ? MAX_AGE
    : Math.min(Math.max(0, config.maxAge), MAX_MAX_AGE);
  const cacheControl = `public, max-age=${(maxAge / 1000) | 0}`;

  return async function faviconMiddleware (ctx, next) {
    if ((ctx.method === 'GET' || ctx.method === 'HEAD') && ctx.path === '/favicon.ico') {
      if (!icon) {
        icon = fsx__default["default"].readFileSync(filePath);
      }
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
const debug$3 = getDebug('serverIoCore');
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
    unwatchFn.push(reload(config.webroot, io, config.reload));
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
    debug$3('webserver on close and clean up');
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
const debug$2 = getDebug('publix-proxy-server');
// Main - async is not right too, this should return an observable
async function createPublicProxyServer (config) {
  // prepare
  const publicPort = config.port;
  const publicHost = Array.isArray(config.host) ? config.host[0] : config.host;
  const internalPort = config[INTERNAL_PORT];
  const internalHost = `http://${DEFAULT_HOST}:${internalPort}`;
  // proxy to internal
  const proxy = new HttpProxy__default["default"]({ target: internalHost, ws: true });
  debug$2('proxy point to ', internalHost);
  // prepare the other proxies
  const { httpProxies, wsProxies } = prepareProxiesConfig(config);
  // create public server
  const publicServer = http__default["default"].createServer((req, res) => {
    const { pathname } = url__default["default"].parse(req.url);
    if (httpProxies[pathname]) {
      debug$2('http proxy catched', pathname);
      return httpProxies[pathname].web(req, res)
    }
    proxy.web(req, res);
  }).on('upgrade', (req, socket, head) => {
    const { pathname } = url__default["default"].parse(req.url);
    debug$2('ws pathname', pathname);
    if (wsProxies[pathname]) {
      debug$2('ws proxy catched', pathname);
      return wsProxies[pathname].ws(req, socket, head)
    }
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
            debug$2('publicServer', info, msg);
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
    debug$2('proxyConfig', proxyConfig);
    const { type } = proxyConfig;
    if (type === 'http') {
      const { context, target } = proxyConfig;
      if (context && target) {
        httpProxies[context] = new HttpProxy__default["default"]({ target });
      } else {
        debug$2('mis-config http proxy', proxyConfig);
      }
    } else if (type === 'ws') {
      const { context, target } = proxyConfig;
      if (context && target) {
        wsProxies[context] = new HttpProxy__default["default"]({ target, ws: true });
      } else {
        debug$2('mis-config ws proxy', proxyConfig);
      }
    } else {
      debug$2('unknown proxy config', proxyConfig);
    }
  });
  debug$2('proxies http:', objLength(httpProxies), 'ws:', objLength(wsProxies));
  return { httpProxies, wsProxies }
}

// V.2 using ESM
const debug$1 = getDebug('main');
// Main
async function serverIoCore (config = {}) {
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
    debug$1(`Internal server started on ${port0}`);
    config[INTERNAL_PORT] = port0;
    config.socketIsEnabled = socketIsEnabled;
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
    debug$1('Public proxy server started on ', address, port);
    config.port = port; // swap the port number because it could be a dynamic port now
    openInBrowser(config);
    startMsg(config);
    // create a table display
    return [port, port0, address]
  };
  // stop all
  const stopAllFn = () => {
    allStop.forEach((stop, i) => {
      debug$1('stop server', i);
      stop();
    });
  };
  // now we deal with the autoStart here
  if (config.autoStart) {
    await startAllFn();
  }
  // return all the references
  return {
    webserver,
    app,
    io,
    start: startAllFn,
    stop: stopAllFn
  }
}

// serverIoCore main

const debug = getDebug('index');
const __dirname$1 = getDirname((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('index.js', document.baseURI).href)));

/**
 * Main entry point for server-io-core
 * @param {object} config options
 * @return {object} http server instance
 * @api public
 */
async function serverIoCorePublic (config = {}) {
  const configCopy = merge({}, config);

  const opts = createConfiguration(configCopy);
  opts.webroot = toArray(opts.webroot).map(dir => path.resolve(dir));
  const { version } = getPkgInfo(path.join(__dirname$1, 'package.json'));
  opts.version = version;

  opts.__processed__ = true;

  debug('user supplied config', configCopy);
  debug('options', util.inspect(opts, false, null, true));

  return await serverIoCore(opts)
}

module.exports = serverIoCorePublic;
//# sourceMappingURL=index.js.map
