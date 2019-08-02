// try to use the http-proxy.ws
const httpProxy = require('http-proxy')
const url = require('url')

const chalk = require('chalk');
const { WS_PROXY } = require('../utils/constants');
const { logutil, ensureFirstSlash } = require('../utils');
const debug = require('debug')('server-io-core:ws-proxy');

const _ = require('lodash');

/**
 * @param {object} webserver the http server instance
 * @param {object} config configuration
 * @param {boolean} socketIsEnabled is it
 * @param {array} namespaceInUsed of all the namespaces we are using
 * @return {void} nothing
 */
module.exports = function(webserver, config, socketIsEnabled, namespaceInUsed) {
  
}
