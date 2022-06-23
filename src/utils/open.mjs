// Open in browser
import open from 'open'
import { getDebug } from './debug.mjs'
import { isString, isWindoze } from './common.mjs'
import {
  DEFAULT_HOST_IP,
  DEFAULT_HOSTNAME
} from '../lib/constants.mjs'

const debug = getDebug('open')

/**
 * Get hostname to open
 * @param {string} hostname config.hostname
 * @return {string} modified hostname
 */
export const getHostname = hostname => {
  const h = Array.isArray(hostname) ? hostname[0] : hostname
  return isWindoze() ? h : h === DEFAULT_HOST_IP ? DEFAULT_HOSTNAME : h
}

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
}

/**
 * Add try catch because sometime if its enable and try this from the server
 * and it will throw error
 * @param {object} config options
 * @return {boolean} true on open false on failed
 */
export function openInBrowser (config) {
  try {
    debug('[open configuration]', config.open)
    let multiple = false
    const args = [constructUrl(config)]
    // If there is just the true option then we need to construct the link
    if (config.open.browser) {
      if (isString(config.open.browser)) {
        args.push({ app: config.open.browser })
      } else if (Array.isArray(config.open.browser)) {
        multiple = config.open.browser.map(browser => {
          return { app: browser }
        })
      }
    }
    // Push this down for the nyc to do coverage deeper
    if (process.env.NODE_ENV === 'test' || config.open.enable === false) {
      return args
    }

    if (multiple === false) {
      debug('[open]', args)
      Reflect.apply(open, open, args)
    } else {
      // Open multiple browsers at once
      multiple.forEach(browser => {
        debug('[open]', browser, args)
        Reflect.apply(open, open, args.concat([browser]))
      })
    }
    return true
  } catch (e) {
    debug('[open] error:', e)
    return false
  }
}
