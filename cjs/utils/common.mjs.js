'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('node:fs');
var os = require('node:os');
var path = require('node:path');
require('node:util');
var url = require('node:url');
var log = require('fancy-log');
var constants = require('../lib/constants.mjs.js');
var template = require('lodash.template');
var process$1 = require('process');
require('fs-extra');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var os__default = /*#__PURE__*/_interopDefaultLegacy(os);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var log__default = /*#__PURE__*/_interopDefaultLegacy(log);
var template__default = /*#__PURE__*/_interopDefaultLegacy(template);

// Utils

const IS_TEST = process.env.NODE_ENV === 'test';

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

/** should get rip of all the lodash crap long time ago */

const isObject = (item) => {
  return (item && typeof item === 'object' && !Array.isArray(item))
};

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
  return [constants.DEFAULT_HOST_IP].concat(ip)
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

Object.defineProperty(exports, 'template', {
  enumerable: true,
  get: function () { return template__default["default"]; }
});
exports.compact = compact;
exports.extend = extend;
exports.forEach = forEach;
exports.getDirname = getDirname;
exports.getDocLen = getDocLen;
exports.getLocalIp = getLocalIp;
exports.getServingIpforOS = getServingIpforOS;
exports.getSocketConnectionConfig = getSocketConnectionConfig;
exports.headerParser = headerParser;
exports.isHtmlFile = isHtmlFile;
exports.isObject = isObject;
exports.isString = isString;
exports.isWindoze = isWindoze;
exports.logutil = logutil;
exports.objLength = objLength;
exports.readDocument = readDocument;
exports.searchFileFromFiles = searchFileFromFiles;
exports.searchIndexFile = searchIndexFile;
exports.toArray = toArray;
