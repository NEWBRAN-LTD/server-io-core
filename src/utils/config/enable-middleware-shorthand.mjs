/**
 * @2018 Port from the original gulp-webserver
 * @2022 already changed 90% of the code
 */
import {
  toArray,
  extend,
  get,
  merge,
  ensureFirstSlash
} from '../common.mjs'
import {
  WS_PROXY,
  CONTEXT_KEY,
  MASTER_MIND
} from '../../lib/constants.mjs'
import {
  trueTypeOf
} from '@jsonql/utils'
/**
 * prepare the proxies configuration
 */
export function prepareProxies (config) {
  if (config.proxies && Array.isArray(config.proxies)) {
    if (config.proxies.length > 0) {
      config.proxies = config.proxies
        .filter(c => c.type && c.context && c.target)
        .map(c => {
          c[CONTEXT_KEY] = ensureFirstSlash(c[CONTEXT_KEY])
          return c
        })
    }
    return config
  }
  throw new Error('Your proxies configuration must be an array!')
}

/**
 * Make sure the incoming parameter to be array when it's coming out
 * @param {array} arraySource list of keys to process
 * @param {object} options the user supply options
 * @return {object} the key props should be array
 */
const ensureArrayProps = (arraySource, options) => {
  return arraySource
    .map(key => {
      // @2019-05-07 if we pass it as a path
      if (key.indexOf('.') > -1) {
        const value = get(options, key)
        const parts = key.split('.')
        const objKey = parts[0]
        const propKey = parts[1]
        // Here could be a problem if the level is deeper than one
        return {
          [objKey]: merge({}, options[objKey], { [propKey]: toArray(value) })
        }
      }
      if (options[key]) {
        return { [key]: toArray(options[key]) }
      }
      return { [key]: [] }
    })
    .reduce((next, last) => {
      return extend(next, last)
    }, options)
}

/**
 * Make sure we get the config in an array
 * @param {object} config for wsProxy
 * @return {mixed} false on failed!
 */
const extractArrayProps = config => {
  if (typeof config === 'object' && config.target && config.enable !== false) {
    return toArray(config.target)
  }
  if (Array.isArray(config)) {
    return config
  }
  return false
}

/**
 * A bit of sideway hack to correct the configuration for a special case
 * wsProxy
 * @param {string} key looking for particular key to work with
 * @param {object} config the config object for that key
 * @param {object} originalDefaults the default options
 * @return {object} the corrected config object
 */
const handleSpecialCase = (key, config, originalDefaults) => {
  if (key === WS_PROXY) {
    const target = extractArrayProps(config)
    if (target !== false) {
      return {
        enable: true,
        target: target
      }
    }
  } else if (key === MASTER_MIND) {
    if (trueTypeOf(config) === 'boolean' && config === true) {
      const defaults = originalDefaults[key]
      const { namespace } = defaults
      return { namespace, enable: true }
    } else if (trueTypeOf(config) === 'string') {
      return { namespace: ensureFirstSlash(config), enable: true }
    }
    /* we don't want them to pass this full object it could mess up
    else if (trueTypeOf(config) === 'object' && config.namespace) {
      return { namespace: ensureFirstSlash(config.namespace) }
    } */
  }
  // @TODO handle the masterMind config here
  return false
}

/**
 * @param {object} defaults the stock options
 * @param {array} props special properties need preserved
 * @param {array} arraySource list of keys that is using array as default
 * @param {object} options configuration params pass by the developer
 * @return {object} configuration
 */
export function enableMiddlewareShorthand (
  defaults,
  props,
  arraySource,
  options
) {
  // Make a copy to use later
  const originalOptions = merge({}, options)
  const originalDefaults = merge({}, defaults)
  /*
    @2018-03-19 The bug is here when call the merge
    lodash.merge merge object into array source turns it into
    a key / value array instead of numeric
    so for the special case `middleware` `proxies`
    we need to double check here before calling the merge function,

    again another problem with the prop inside an object that is not array but
    we need it to be an array
  */
  const tmpProp = ensureArrayProps(arraySource, options)
  const config = merge({}, defaults, tmpProp)
  // This just make sure it's an array
  if (Object.prototype.toString.call(props) === '[object String]') {
    props = [props]
  }
  for (let i = 0, len = props.length; i < len; ++i) {
    const prop = props[i]
    // Debug('prop', prop);
    /**
     * The problem is when someone pass optionName: true
     * it just using the default options
     * what if they just pass alternative config without passing
     * enable: true
     * then the feature is not enable
     */
    const specialCase = handleSpecialCase(prop, config[prop], originalDefaults)
    if (specialCase !== false) {
      config[prop] = specialCase
    } else if (config[prop] === true) {
      config[prop] = merge({}, originalDefaults[prop])
      config[prop].enable = true
    } else if (originalOptions[prop] && Object.keys(originalOptions[prop]).length) {
      // If the user has provided some property
      // Then we add the enable here for the App to use
      config[prop].enable = true
    } else if (config[prop] === false) {
      config[prop] = merge({}, originalDefaults[prop], { enable: false })
    }
  }
  // Change from sessionId to timestamp, just for reference not in use anywhere
  config.timestamp = Date.now()
  return config
}
