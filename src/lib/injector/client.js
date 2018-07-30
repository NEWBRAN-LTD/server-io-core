/**
 * This will combine debugger and reload client file overwrite in one place
 * there will be just one middleware to handle them
 */
const fs = require('fs');
const _ = require('lodash');
const chalk = require('chalk');
const { join } = require('path');
// Const gutil = require('gulp-util');
const { logutil } = require('../utils/helper');
const { getSocketConnectionConfig } = require('../utils/helper');
// @20171117 integration with stacktrace

// Note the config is only the debugger part
module.exports = config => {
  // Now we need to supply a configurated option to not just point to our own local test machine
  // const debuggerHost = config.server.host || config.host;
  // const debuggerPort = config.server.port || config.port;
  const stacktraceName = 'stacktrace.js';
  // @BUG when this is running in server mode, the file disappeared?
  // that's because the file is not copy inside the node_modules anymore
  const searchStacktraceSrc = () => {
    const stacktraceFile = join(
      'node_modules',
      'stacktrace-js',
      'dist',
      'stacktrace-with-promises-and-json-polyfills.js'
    );
    return [join(__dirname, '..', '..', '..', stacktraceFile), stacktraceFile]
      .filter(f => {
        return fs.existsSync(f);
      })
      .reduce((first, next) => {
        return next;
      }, null);
  };
  // Debugger
  const debuggerPath = config.debugger.namespace;
  const eventName = config.debugger.eventName;
  const debuggerJs = [debuggerPath, config.debugger.js].join('/');
  const stacktraceJsFile = [debuggerPath, stacktraceName].join('/');
  // Reload
  const reloadPath = config.reload.namespace;
  const reloadEventName = config.reload.eventName;
  const reloadJs = [reloadPath, config.reload.js].join('/');
  // Just notify the console
  // logutil(chalk.white('[debugger] ') + chalk.yellow('client is running'));
  // Export middleware
  return function(req, res, next) {
    switch (req.url) {
      case debuggerJs:
        fs.readFile(join(__dirname, '..', 'debugger', 'client.tpl'), (err, data) => {
          if (err) {
            res.writeHead(500);
            const msg = 'Error reading io-debugger-client file';
            logutil(chalk.red(msg), chalk.yellow(err));
            return res.end(msg);
          }
          // If they want to ping the server back on init
          const ping =
            typeof config.debugger.client === 'object' && config.debugger.client.ping
              ? 'true'
              : 'false';
          // There is a problem when the server is running from localhost
          // and serving out to the proxy and the two ip address are not related to each other
          // and for most of the cases, the client is always pointing back to itself anyway
          const serveDataFn = _.template(data.toString());
          // Force websocket connection
          // see: http://stackoverflow.com/questions/8970880/cross-domain-connection-in-socket-io
          // @2017-06-29 forcing the connection to socket only because it just serving up local!
          const connectionOptions = getSocketConnectionConfig(config);
          // Using the template method instead
          const serveData = serveDataFn({
            debuggerPath,
            eventName,
            ping,
            connectionOptions,
            consoleDebug: config.debugger.consoleDebug
          });
          // @TODO we should cache this file, otherwise every reload will have to generate it again
          // The question is where do we cache it though ...
          res.set('Content-Type', 'application/javascript');
          res.writeHead(200);
          res.end(serveData);
        });
        break;
      case stacktraceJsFile:
        fs.readFile(searchStacktraceSrc(), { encoding: 'utf8' }, (err, data) => {
          if (err) {
            res.writeHead(500);
            const msg = 'Error reading stacktrace source file!';
            logutil(chalk.red(msg), chalk.yellow(err));
            return res.end(msg);
          }
          res.set('Content-Type', 'application/javascript');
          res.writeHead(200);
          res.end(`${data}`);
        });
        break;
      case reloadJs:
        fs.readFile(join(__dirname, '..', 'reload', 'reload.tpl'), (err, data) => {
          if (err) {
            res.writeHead(500);
            const msg = 'Error reading io-reload-client file';
            logutil(chalk.red(msg), chalk.yellow(err));
            return res.end(msg);
          }
          const clientFileFn = _.template(data.toString());
          const connectionOptions = getSocketConnectionConfig(config);
          const serveData = clientFileFn({
            reloadNamespace: reloadPath,
            eventName: reloadEventName,
            connectionOptions
          });
          res.set('Content-Type', 'application/javascript');
          res.writeHead(200);
          res.end(serveData);
        });
        break;
      default:
        next();
    }
  };
};
