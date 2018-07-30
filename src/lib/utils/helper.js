/* eslint-disable */
/**
 * Move some of the functions out of the main.js to reduce the complexity
 */
const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const express = require('express');
const log = require('fancy-log');
const test = process.env.NODE_ENV === 'test';
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
 * @param {string} webroot path to where the files are
 * @param {object} config the main config
 * @param {string} urlToOpen (optional) @TODO
 * @return {function} middleware
 */
const serveStatic = (webroot, config, urlToOpen = '') => {
  let etag = true;
  // @TODO this is not quite right, need to allow set the path
  if (config.development === false) {
    const _root = process.cwd();
    if (webroot === path.join(_root, 'app')) {
      webroot = path.join(_root, 'dest');
    }
  } else {
    etag = false;
  }
  // set header only when not using the http-proxy-middlewares
  const headerOption = (config.proxies.length) ? {setHeaders: setHeaders(config, urlToOpen)} : {};
  // @TODO configure the directoryListing option here
  const staticOptions = _.merge(
    {
      index: toArray(config.indexes),
      etag: etag
    },
    headerOption,
    config.staticOptions
  );
  // Does this need to be replace with serve-static? 05032018
  return express.static(webroot, staticOptions);
};

/**
 * delay proxy @TODO not finish yet - 1.5.0 feature
 * @param {string} originalUrl (url to delay)
 * @param {int} delayReqTime time to delay when request in ms
 * @param {int} delayResTime time to delay when response in ms
 * @return {function} middleware to use: app.use(url, proxyDelay, myProxy);
 */
const proxyDelay = (originalUrl, delayReqTime, delayResTime) => {
  return function (req, res, next) {
    if (req.originalUrl === originalUrl) {
      // Delay request by 2 seconds
      setTimeout(next, delayReqTime);
      // Delay response completion by 5 seconds
      const endOriginal = res.end;
      res.end = function (...args) {
        setTimeout(function () {
          endOriginal.apply(res, args);
        }, delayResTime);
      };
    } else {
      next();
    }
  }
};

/**
 * directory listing - no longer support since 1.4.0-alpha.2
 */
/*
exports.directoryListing = (dir) => {
  return express.directory(dir);
};
*/

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

// Export
module.exports = {
  setHeaders,
  getRandomInt,
  toArray,
  proxyDelay,
  serveStatic,
  getSocketConnectionConfig,
  ensureIsDir,
  logutil
};
