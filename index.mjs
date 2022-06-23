// serverIoCore main
import { join, resolve } from 'node:path'
import { inspect } from 'node:util'
import { createConfiguration } from './src/utils/config/index.mjs'
import { serverIoCore } from './src/index.mjs'
import { toArray, getDebug, merge, getDirname, getPkgInfo } from './src/utils/index.mjs'

const debug = getDebug('index')
const __dirname = getDirname(import.meta.url)

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
  const { version } = getPkgInfo(join(__dirname, 'package.json'))
  opts.version = version

  opts.__processed__ = true

  debug('user supplied config', configCopy)
  debug('options', inspect(opts, false, null, true))

  return await serverIoCore(opts)
}
