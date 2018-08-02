#!/usr/bin/env node
/**
 * Command line interface with meow
 * $ server-io-core ./dist
 * or
 * $ srvio ./
 */
const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const meow = require('meow');
const log = require('fancy-log');
// Main
const serverIoCore = require('./index');
// Config
const alias = {
  p: 'port',
  h: 'host',
  s: 'ssl',
  c: 'config'
};
const cli = meow(
  `
   Usage
     $ server-io-core <root>
     // or
     $ srvio <root>

   Options
     -p, --port Port number (default 8000)
     -h, --host host name (default localhost)
     -s, --https use https using snake oil cert (default to false)
     -c, --config pass a config json file (default '')

   Examples
     $ server-io-core /path/to/app
   or pass as an array
     $ server-io-core /path/to/app,node_modules,dev

   Serve up to broadcast your app
     $ server-io-core /path/to/app -h 0.0.0.0

   Use a config file
     $ server-io-core /path/to/app -c ./config.json
   The configuration option is the same as in README
   * When using --config (-c) flag, all the other flag will be ignore
 `,
  { alias }
);
const serve = cli => {
  if (_.isEmpty(cli.input[0])) {
    return log.error(
      'Sorry the path to your file is required! Run `server-io-core` --help for more information'
    );
  }
  const argv = cli.flags;
  const dirs = cli.input[0].split(',');
  serverIoCore(
    (function() {
      let config;
      config.webroot = dirs.map(d => path.resolve(d));
      // Use the config to ovewrite everything else
      if (argv.config) {
        config = fs.readJsonSync(argv.config);
        if (!config) {
          throw new Error(['configuration file', argv.config, 'not found!'].join(' '));
        }
      } else {
        config = {};
        if (argv.port) {
          config.port = argv.port;
        }
        if (argv.host) {
          config.host = argv.host;
        }
        if (argv.https) {
          config.https = {
            enable: true
          };
        }
      }
      return config;
    })()
  );
};
// Run
serve(cli);
