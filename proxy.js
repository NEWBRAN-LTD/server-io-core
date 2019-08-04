// New top import for using proxy
const { createConfiguration } = require('./src/lib/options');
const { serverIoCore } = require('./src');
const { resolve } = require('path');
const { toArray } = require('./src/lib/utils/');
const { inspect } = require('util');
const debug = require('debug')('server-io-core:main:proxy');
/*
We have tried almost every single scenario to try to integrate the proxy
with our own setup, most of the time FAILED. That is to do with the
other methods that integrate into the same http.createServer instance
and the proxy is unable to do anything

Therefore when needed to use proxy web and proxy socket together
We need to put the server-io-core down one port number, and use
the proxy server to front every single thing

example

[client port 8000] --> web --> [server-io-core:7999]
                   --> socket --> [server-io-core:7999]
                   --> other web interface --> [other server: their own host:port]
                   ... more
                   --> other socket interface --> [other socket server: their own host:port]
*/

/**
 * Sort out all the options
 * @param {object} opts
 * @return {object} opts sort out for proxies
 */
function reconfig(opts) {}

/**
 * @param {object} config configuration
 * @return {object} generated methods map
 */
module.exports = function(config = {}) {
  const opts = createConfiguration(config);
  opts.webroot = toArray(opts.webroot).map(dir => resolve(dir));
  opts.__processed__ = true;
  // New from here onward
  opts.__proxied__ = true;
  if (config.proxies.length) {
  }

  return serverIoCore(opts);
};
