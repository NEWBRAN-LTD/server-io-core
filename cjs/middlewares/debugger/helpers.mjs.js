'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var util = require('node:util');
var common = require('../../utils/common.mjs.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var util__default = /*#__PURE__*/_interopDefaultLegacy(util);

/**
 * Take out a bunch of functions from the original debugger setup
 */

const keys = ['browser', 'location'];
const lb = '-'.repeat(90);

// Ditch the npm:table
const table = rows => {
  if (Array.isArray(rows)) {
    rows.forEach(row => common.logutil(row));
  } else {
    common.logutil(rows);
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
  if (common.isString(_msg)) {
    rows.push(['MESSAGE:', e.msg].join(' '));
  } else {
    let toShow;
    const msgToArr = common.isString(_msg) ? parseObj(_msg) : _msg;
    if (Array.isArray(msgToArr)) {
      rows.push('MESSAGE(S):');
      msgToArr.forEach(a => {
        if (typeof a === 'object') {
          rows.push(lb);
          let rowCtn = 1;
          common.forEach(a, (v, k) => {
            if (v) {
              toShow = common.isObject(v) ? util__default["default"].inspect(v, false, null) : v;
              rows.push([rowCtn + ':', toShow].join(' '));
              ++rowCtn;
            }
          });
        } else {
          rows.push(a);
        }
      });
      rows.push([lb, 'END'].join(' '));
    } else if (common.isObject(_msg)) {
      rows.push(lb);
      common.forEach(_msg, (v, k) => {
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

exports.displayError = displayError;
exports.parseObj = parseObj;
exports.table = table;
