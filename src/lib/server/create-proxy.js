// Proxy front setup V1.2.0
const HttpProxy = require('http-proxy');
const url = require('url');
const { ensureFirstSlash, inArray } = require('../utils');
const debug = require('debug')('server-io-core:create-proxy');
const _ = require('lodash');

/**
 * create a front proxy server
 * @param {object} webserver http.createServer instance
 * @param {object} opts configuration
 * @param {int} port the number this proxy server run on
 * @param {array} namespaceInUsed for filter out namespace
 * @param {array} socketProxies socket proxy config
 * @param {array} webProxies web proxy config
 * @return {void} nothing
 */
module.exports = function(webserver, opts, port, namespaceInUsed, socketProxies, webProxies) {

}
