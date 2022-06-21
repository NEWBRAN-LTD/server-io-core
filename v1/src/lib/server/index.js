/**
 * This will generate the web server
 * as well as the socket server
 * also @TODO a middleware transport server to connect to collaboly network
 */
const webserverGenerator = require('./webserver');
const socketServer = require('./socket');
const staticServe = require('./static-serve');
const httpProxy = require('./http-proxy');
// @TODO replace the internal
const createProxy = require('./create-proxy');

// Exports
module.exports = {
  webserverGenerator,
  staticServe,
  socketServer,
  httpProxy,
  createProxy
};
