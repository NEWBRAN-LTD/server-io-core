// serverIoCore main
const { join, resolve } = require('path')
const { inspect } = require('util')
const { createConfiguration } = require('./cjs/utils/config/index.mjs')
const { serverIoCore } = require('./cjs/index.mjs')
const { toArray, getDebug, merge, getPkgInfo } = require('./cjs/utils/index.mjs')

const debug = getDebug('index')

/**
 * Main entry point for server-io-core
 * @param {object} config options
 * @return {object} http server instance
 * @api public
 */
async function serverIoCorePublic (config = {}) {
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
// named export
module.exports = { serverIoCore: serverIoCorePublic }
