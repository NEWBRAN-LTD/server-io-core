/**
 * This will generate the web server
 * as well as the socket server
 * also @TODO a middleware transport server to connect to collaboly network
 */
const webserver = require('./webserver');
const socketServer = require('./socket');
// Const mockServer = require('./mock-server');
const staticServe = require('./static-serve');
const wsProxyServer = require('./ws-proxy');

// Exports
module.exports = {
  webserver,
  staticServe,
  socketServer,
  wsProxyServer
};
