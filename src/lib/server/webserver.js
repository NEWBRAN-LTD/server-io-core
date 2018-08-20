/**
 * The generated server code are identical on both side anyway
 */
const fs = require('fs');
const http = require('http');
const https = require('https');
const chalk = require('chalk');
const { logutil } = require('../utils/helper');
// According to https://github.com/visionmedia/supertest/issues/111
// Put this here to make sure it works everywhere
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
/**
 * @param {object} app the connect app
 * @param {object} config options
 * @return {object} http(s) webserver, (fn) start, (fn) stop
 */
module.exports = function(app, config) {
  let webserver;
  if (config.https.enable) {
    let opts;
    let msg = '';
    if (config.https.key && config.https.cert) {
      if (fs.existsSync(config.https.key) && fs.existsSync(config.https.cert)) {
        opts = {
          key: fs.readFileSync(config.https.key),
          cert: fs.readFileSync(config.https.cert)
        };
      } else {
        msg = 'The key or cert you provide via the https configuration can not be found!';
        logutil(chalk.white('[https Error]'), chalk.red(msg));
        throw new Error(msg);
      }
    } else if (config.https.pfx && config.https.passphrase) {
      if (fs.existsSync(config.https.pfx)) {
        opts = {
          pfx: fs.readFileSync(config.https.pfx),
          passphrase: config.https.passphrase
        };
      } else {
        msg = 'The pfx you prvide via the https configuration can not be found!';
        logutil(chalk.white('[https Error]'), chalk.red(msg));
        throw new Error(msg);
      }
    } else {
      // Need to check if the user provide file exist or not!
      opts = {
        key: fs.readFileSync(config.https.devKeyPem),
        cert: fs.readFileSync(config.https.devCrtPem)
      };
    }
    // @2018-07-30 change to Koa style
    webserver = https.createServer(opts, app.callback());
  } else {
    // See last comment
    webserver = http.createServer(app.callback());
  }
  // Return it
  return {
    webserver,
    start: () => {
      webserver.listen(config.port, config.host[0], config.callback);
    },
    stop: () => {
      webserver.close();
    }
  };
};
