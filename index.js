// Server-io-core main
const { createConfiguration } = require('./src/lib/options')
const { serverIoCore } = require('./src')
const { resolve } = require('path')
const { toArray } = require('./src/lib/utils/')
const { inspect } = require('util')
const { merge } = require('lodash')
const debug = require('debug')('server-io-core:main')

/**
 * Main entry point for server-io-core
 * @param {object} config options
 * @return {object} http server instance
 * @api public
 */
module.exports = function(config = {}) {
    
    debug('original config', config)
    
    const configCopy = merge({}, config) // make sure it can not get mutated  

    const opts = createConfiguration(configCopy)
    opts.webroot = toArray(opts.webroot).map(dir => resolve(dir))
    opts.__processed__ = true

    debug('configCopy', configCopy)
    debug('options', inspect(opts, false, null, true))

    return serverIoCore(opts)
}
