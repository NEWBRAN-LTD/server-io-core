'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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

const DEFAULT_HOSTNAME = 'localhost';

const MAX_AGE = 86400000;
const MAX_MAX_AGE = 31556926000;
const EVENT_NAME = 'change';
const DEFAULT_WAIT = 5000;
// we use random port
const DEFAULT_PORT = 0;
const DEFAULT_HOST = 'localhost';
const INTERNAL_PORT = '__internal_port__';

exports.CSS_CONTENT_TYPE = CSS_CONTENT_TYPE;
exports.DEBUG_MAIN_KEY = DEBUG_MAIN_KEY;
exports.DEFAULT_HOST = DEFAULT_HOST;
exports.DEFAULT_HOSTNAME = DEFAULT_HOSTNAME;
exports.DEFAULT_HOST_IP = DEFAULT_HOST_IP;
exports.DEFAULT_PORT = DEFAULT_PORT;
exports.DEFAULT_WAIT = DEFAULT_WAIT;
exports.EVENT_NAME = EVENT_NAME;
exports.INTERNAL_PORT = INTERNAL_PORT;
exports.MAX_AGE = MAX_AGE;
exports.MAX_MAX_AGE = MAX_MAX_AGE;
exports.contentType = contentType;
exports.cordovaJs = cordovaJs;
exports.dummyJs = dummyJs;
exports.stacktraceName = stacktraceName;
