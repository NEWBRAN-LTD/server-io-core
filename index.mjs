// serverIoCore main
import { resolve } from 'node:path'
import { inspect } from 'node:util'
import { createConfiguration } from './src/utils/config/index.mjs'
import serverIoCore from './src/index.mjs'
import { toArray, getDebug, merge } from './src/utils/index.mjs'

const debug = getDebug('index')

/**
 * Main entry point for server-io-core
 * @param {object} config options
 * @return {object} http server instance
 * @api public
 */
export default async function serverIoCorePublic (config = {}) {
  const configCopy = merge({}, config)
  const opts = createConfiguration(configCopy)
  opts.webroot = toArray(opts.webroot).map(dir => resolve(dir))
  opts.__processed__ = true

  debug('user supplied config', configCopy)
  debug('options', inspect(opts, false, null, true))

  return await serverIoCore(opts)
}
