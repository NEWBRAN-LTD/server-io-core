'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var path = require('node:path');
var fsx = require('fs-extra');
require('meow');
var log = require('fancy-log');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var fsx__default = /*#__PURE__*/_interopDefaultLegacy(fsx);
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
const cliTxt = `
 Usage
   $ server-io-core <root>
   // or
   $ srvio <root>

 Options
   -p, --port Port number (default 0 - dynamic)
   -h, --host host name (default 0.0.0.0)
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
`;
// create cli
const getCli = (meow) => meow(
  cliTxt,
  {
    alias,
    importMeta: ({ url: (typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('cli.mjs.js', document.baseURI).href)) }) // ESM required crap
  }
);
// we change the passing function from cli to serverIoCore that construct this on the root level
const serve = async (serverIoCore) => {
  const meow = await Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespace(require('meow')); });
  const cli = getCli(meow);
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
