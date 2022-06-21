// prepare config
import {
  defaultProperties,
  arraySource,
  defaultOptions
} from './defaults.mjs'
import {
  enableMiddlewareShorthand,
  prepareProxies
} from './enable-middleware-shorthand.mjs'
// main method
function createConfiguration (options = {}) {
  const config = enableMiddlewareShorthand(
    defaultOptions,
    defaultProperties,
    arraySource,
    options
  )
  return prepareProxies(config)
}
// export
export {
  defaultOptions,
  defaultProperties,
  createConfiguration
}
