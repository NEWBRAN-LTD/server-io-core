/**
 * This will generate the web server
 * as well as the socket server
 * also @TODO a middleware transport server to connect to collaboly network
 */
const webserverGenerator = require('./webserver');
const socketServer = require('./socket');
// Const mockServer = require('./mock-server');
const staticServe = require('./static-serve');
const wsProxyServer = require('./ws-proxy');

// Exports
module.exports = {
  webserverGenerator,
  staticServe,
  socketServer,
  wsProxyServer
};
