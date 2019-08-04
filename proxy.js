// New top import for using proxy
const { createConfiguration } = require('./src/lib/options');
const { serverIoCore } = require('./src');
const { resolve } = require('path');
const { toArray } = require('./src/lib/utils/');
const { createProxy } = require('./src/lib/server')
const openInBrowser = require('./src/lib/utils/open');

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
 * Check if there is any socket proxy
 * @param {array} proxies
 * @return {boolean} true
 */
function hasSocketProxy(proxies) {
  return proxies.filter(proxy => proxy.ws)
}

/**
 * Sort out all the options
 * @param {object} opts
 * @return {object} opts sort out for proxies
 */
function reconfig(opts) {
  if (opts.port === opts.port0) {
    throw new Error(`port and port0 can not be the same!`)
  }
  // store for later use
  const port0 = opts.port0;
  const port = opts.port;
  const autoStart = config.autoStart;
  const open = config.open;
  opts.autoStart = false;
  opts.open = false;
  // swap the port
  opts.port = port0;
  const socketProxies = hasSocketProxy(config.proxies)
  if (!socketProxies.length) {socketProxies
    console.error(`There is no socket proxy config, you don't need to call this api!`)
  }
  const webProxies = opts.proxies.filter(proxy => !proxy.ws)
  // return the new opts
  return {
    opts,
    port0, // <-- the server-io-core running on
    port, // <-- this server is going to run on
    open,
    autoStart,
    socketProxies,
    webProxies
  }
}

/**
 * @param {object} config configuration
 * @return {object} generated methods map
 */
module.exports = function(config = {}) {
  const opts0 = createConfiguration(config);
  opts0.webroot = toArray(opts.webroot).map(dir => resolve(dir));
  opts0.__processed__ = true;
  // New from here onward
  opts0.__proxied__ = true;
  if (opts0.proxies.length) {
    let { opts, port, port0, open, autoStart, socketProxies, webProxies } = reconfig(opts0)
    let { webserver, app, start, stop, io, namespaceInUsed } = serverIoCore(opts)
    // need to create the new start stop methods
    const startBackServer = start;
    const stopBackServer = stop;
    // also need to reconfig the open and the callback
    const frontWebServer = createProxy(opts, port, namespaceInUsed, socketProxies, webProxies)
    const result = {
      io,
      app,
      webserver,
      start: () => {
        
      },
      stop: () => {

      }
    }
    if (autoStart) {
      result.start()
    }
    // return the same name but different context props out
    return result;
  }
  return serverIoCore(opts);
};
