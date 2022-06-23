'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('node:fs');
var http = require('node:http');
var https = require('node:https');
require('debug');
var constants = require('../lib/constants.mjs.js');
require('../utils/open.mjs.js');
var common = require('../utils/common.mjs.js');
require('../utils/config/defaults.mjs.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var http__default = /*#__PURE__*/_interopDefaultLegacy(http);
var https__default = /*#__PURE__*/_interopDefaultLegacy(https);

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
        common.logutil('[https Error]', msg);
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
        common.logutil('[https Error]', msg);
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
          config.port0 || constants.DEFAULT_PORT, // we could pick a port for test purpose
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

exports.webserverGenerator = webserverGenerator;
