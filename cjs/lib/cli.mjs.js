'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var path = require('node:path');
var fsx = require('fs-extra');
var meow = require('meow');
var log = require('fancy-log');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var fsx__default = /*#__PURE__*/_interopDefaultLegacy(fsx);
var meow__default = /*#__PURE__*/_interopDefaultLegacy(meow);
var log__default = /*#__PURE__*/_interopDefaultLegacy(log);

/*
Instead of creating all the cli methods in one file
we break them up into function here and let the top
level call to include them
*/
// import { serverIoCore } from '../index.mjs'
// Config shorthand map
const alias = {
  p: 'port',
  h: 'host',
  s: 'ssl',
  c: 'config'
};
// create cli
const cli = meow__default["default"](
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
// we change the passing function from cli to serverIoCore that construct this on the root level
const serve = serverIoCore => {
  if (!fsx__default["default"].existsSync(cli.input[0])) {
    return log__default["default"].error(
      'Sorry the path to your file is required! Run `server-io-core` --help for more information'
    )
  }
  const argv = cli.flags;
  const dirs = cli.input[0].split(',');
  serverIoCore(
    (function () {
      let config;
      // Use the config to ovewrite everything else
      if (argv.config) {
        // Now we need to check if that's a js file or json file
        const configfile = argv.config;
        if (path__default["default"].extname(configfile) === '.json') {
          config = fsx__default["default"].readJsonSync(configfile);
        } else if (path__default["default"].extname(configfile) === '.js') {
          config = require(configfile);
        }
        if (!config) {
          throw new Error(
            ['configuration file', configfile, ' is not supported or not found!'].join(
              ' '
            )
          )
        }
      } else {
        config = {
          webroot: dirs.map(d => path__default["default"].resolve(d))
        };
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
      return config
    })()
  );
};

exports.serve = serve;
