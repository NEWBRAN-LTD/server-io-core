/* eslint-disable */
/**
 * Move some of the functions out of the main.js to reduce the complexity
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const _ = require('lodash');
const log = require('fancy-log');
const { defaultHostIp } = require('./constants');

const test = process.env.NODE_ENV === 'test';

/**
 * @return {string} ip address
 */
const getLocalIp = () => (
  Object.values(os.networkInterfaces()).filter(net => {
    return net[0].address !== '127.0.0.1';
  }).reduce((last, next) => {
    return next[0].address;
  }, '')
);

/**
 * @return {boolean} windoze or not
 */
const isWindoze = () => (os.platform().indexOf('win') === 0);

/**
 * If's it's windows then need to get the ip address of the network interface
 * otherwise we just need to use 0.0.0.0 to bind to all
 * @return {string} ip address
 */
const getServingIpforOS = () => {
  const ip = getLocalIp();
  if (isWindoze()) {
    return [ip, ip];
  }
  return [defaultHostIp, ip];
};

// Const debug = process.env.DEBUG;
// Main
const logutil = function(...args) {
  if (!test) {
    Reflect.apply(log, null, args);
  }
};

/**
 * create a random number between two values, for creating a random port number
 * @param {int} min
 * @param {int} max
 * @return {int} port
 */
const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Make sure the supply argument is an array
 */
const toArray = param => {
  if (param) {
    return Array.isArray(param) ? param : [param];
  }
  return [];
};

/**
 * @param {mixed} opt
 * @return {boolean} result
 */
const isString = opt => {
  return _.isString(opt);
};

/**
 * Set headers @TODO there is bug here that cause the server not running correctly
 * @param {object} config
 * @param {string} urlToOpen
 * @return {function} middleware
 */
const setHeaders = (config, urlToOpen) => {
  return res => {
    if (isString(config.headers.origin) || (urlToOpen && urlToOpen.indexOf('http') === 0)) {
      res.setHeader(
        'Access-Control-Allow-Origin',
        isString(config.headers.origin) || (isString(urlToOpen) || '*')
      );
    }
    res.setHeader(
      'Access-Control-Request-Method',
      isString(config.headers.requestMethod) || '*'
    );
    res.setHeader(
      'Access-Control-Allow-Methods',
      isString(config.headers.allowMethods) || 'GET , POST , PUT , DELETE , OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      isString(config.headers.allowHeaders) || 'Content-Type, Authorization, Content-Length, X-Requested-With'
    );
  };
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
  return connectionOptions;
};

/**
 * Make sure to pass directories to this method
 * @20180322 Add if this is not a directory then we resolve the file path directory
 * @param {array} filePaths array of directories
 * @return {array} fixed paths
 */
const ensureIsDir = filePaths => {
  const paths = toArray(filePaths);
  return _.compact(
    paths.map(d => {
      return fs.existsSync(d)
        ? fs.lstatSync(d).isDirectory()
          ? d
          : path.dirname(d)
        : false;
    })
  );
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
        return h === type;
      });
    }
    return headers;
  } catch(e) {
    // When Chrome dev tool activate the headers become empty
    return [];
  }
};

/**
 * get document (string) byte length for use in header
 * @param {string} doc to calculate
 * @return {number} length
 */
const getDocLen = doc => {
  return Buffer.byteLength(doc, 'utf8');
};

/**
 * turn callback to promise
 * @param {string} p path to file
 * @return {object} promise to resolve
 */
const readDocument = p => {
  return new Promise((resolver, rejecter) => {
    fs.readFile(p, {encoding: 'utf8'}, (err, data) => {
      if (err) {
        return rejecter(err);
      }
      resolver(data);
    });
  });
};

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
    .filter(fs.existsSync)
    .reduce((last, next) => {
      return next;
    }, null);
};

/**
 * Double check if its a HTML file
 * @param {string} file path
 * @return {boolean} or not
 */
const isHtmlFile = file => {
  const ext = path.extname(file).toLowerCase();
  return ext === '.html' || ext === '.htm';
};


// Export
module.exports = {
  searchIndexFile,
  isHtmlFile,
  readDocument,
  getDocLen,
  setHeaders,
  getRandomInt,
  toArray,
  getSocketConnectionConfig,
  ensureIsDir,
  logutil,
  headerParser,
  getLocalIp,
  getServingIpforOS,
  isWindoze
};
