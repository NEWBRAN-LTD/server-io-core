'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var debugFn = require('debug');
var constants = require('../lib/constants.mjs.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var debugFn__default = /*#__PURE__*/_interopDefaultLegacy(debugFn);

// main
function getDebug (key) {
  return debugFn__default["default"]([constants.DEBUG_MAIN_KEY, key].join(':'))
}

exports.getDebug = getDebug;
