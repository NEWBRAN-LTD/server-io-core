'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var open = require('open');
var debug$1 = require('./debug.mjs.js');
var common = require('./common.mjs.js');
var constants = require('../lib/constants.mjs.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var open__default = /*#__PURE__*/_interopDefaultLegacy(open);

// Open in browser

const debug = debug$1.getDebug('open');

/**
 * Get hostname to open
 * @param {string} hostname config.hostname
 * @return {string} modified hostname
 */
const getHostname = hostname => {
  const h = Array.isArray(hostname) ? hostname[0] : hostname;
  return common.isWindoze() ? h : h === constants.DEFAULT_HOST_IP ? constants.DEFAULT_HOSTNAME : h
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
    debug('[open configuration]', config.open);
    let multiple = false;
    const args = [constructUrl(config)];
    // If there is just the true option then we need to construct the link
    if (config.open.browser) {
      if (common.isString(config.open.browser)) {
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
      debug('[open]', args);
      Reflect.apply(open__default["default"], open__default["default"], args);
    } else {
      // Open multiple browsers at once
      multiple.forEach(browser => {
        debug('[open]', browser, args);
        Reflect.apply(open__default["default"], open__default["default"], args.concat([browser]));
      });
    }
    return true
  } catch (e) {
    debug('[open] error:', e);
    return false
  }
}

exports.getHostname = getHostname;
exports.openInBrowser = openInBrowser;