// For v1.3.x development to replace all the DIY proxy options back to node-http-proxy
// The idea is actually very simple
// we start up the proxy server when we start our website and hijack the call before
// it reaches Koa
const httpProxy = require('http-proxy');

module.exports = httpProxy;
