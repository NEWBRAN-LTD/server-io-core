/**
 * This will generate the web server
 * as well as the socket server
 * also @TODO a middleware transport server to connect to collaboly network
 */
const webserver = require('./webserver');
const socketServer = require('./socket');
const mockServer = require('./mock-server');
const staticDir = require('koa-static');
const { toArray } = require('../utils/helper');
/**
 * Customize version of koa-static
 * @param {object} config full options
 * @return {function} to call
 */
exports.serveStatic = config => {
  const dirs = toArray(config.webroot);
  const opts = {
    defer: true
  };
  if (config.index) {
    opts.index = config.index;
  }
  return app => {
    dirs.forEach(dir => {
      app.use(staticDir(dir, opts));
    });
  };
};
// Exports
exports.webserverGenerator = webserver;
exports.socketServer = socketServer;
exports.mockServer = mockServer;
