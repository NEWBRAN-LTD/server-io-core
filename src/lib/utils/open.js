/**
 * Open in browser during development
 */
const _ = require('lodash');
const open = require('open');
const debug = require('debug')('server-io-core:open');
const { isWindoze } = require('./index');
const { defaultHostIp } = require('./constants');
/**
 * Get hostname to open
 * @param {string} hostname config.hostname
 * @return {string} modified hostname
 */
const getHostname = hostname => {
  const h = _.isArray(hostname) ? hostname[0] : hostname;
  return isWindoze() ? h : h === defaultHostIp ? 'localhost' : h;
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
  ].join(':');
};

/**
 * Add try catch because sometime if its enable and try this from the server
 * and it will throw error
 * @param {object} config options
 * @return {boolean} true on open false on failed
 */
module.exports = function(config) {
  try {
    debug('[open configuration]', config.open);
    let multiple = false;
    let args = [constructUrl(config)];
    // If there is just the true option then we need to construct the link
    if (config.open.browser) {
      if (_.isString(config.open.browser)) {
        args.push({ app: config.open.browser });
      } else if (_.isArray(config.open.browser)) {
        multiple = config.open.browser.map(browser => {
          return { app: browser };
        });
      }
    }

    // Push this down for the nyc to do coverage deeper
    if (process.env.NODE_ENV === 'test' || config.open.enable === false) {
      return args;
    }

    if (multiple === false) {
      debug('[open]', args);
      Reflect.apply(open, open, args);
    } else {
      // Open multiple browsers at once
      multiple.forEach(browser => {
        debug('[open]', browser, args);
        Reflect.apply(open, open, args.concat([browser]));
      });
    }

    return true;
  } catch (e) {
    debug('[open] error:', e);
    return false;
  }
};
