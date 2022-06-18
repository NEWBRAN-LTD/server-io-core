// serverIoCore main
import { resolve } from 'node:path'
import { inspect } from 'node:util'
import { createConfiguration } from './src/utils/config/index.mjs'
import serverIoCore from './src'
import { toArray, getDebug } from './src/utils'
import merge from 'lodash-es/merge'

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

  debug('configCopy', configCopy)
  debug('options', inspect(opts, false, null, true))

  return await serverIoCore(opts)
}
