import {
  defaultProperties,
  arraySource,
  defaultOptions
} from './defaults.mjs'
import enableMiddlewareShorthand from './enable-middleware-shorthand.mjs'

function createConfiguration (options = {}) {
  return enableMiddlewareShorthand(
    defaultOptions,
    defaultProperties,
    arraySource,
    options
  )
}

// export
export {
  defaultOptions,
  defaultProperties,
  createConfiguration
}
