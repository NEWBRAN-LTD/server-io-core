/*
Instead of creating all the cli methods in one file
we break them up into function here and let the top
level call to include them
*/
import path from 'node:path'
import fsx from 'fs-extra'
import log from 'fancy-log'
// import { serverIoCore } from '../index.mjs'
// Config shorthand map
export const alias = {
  p: 'port',
  h: 'host',
  s: 'ssl',
  c: 'config'
}
export const cliTxt = `
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
`
// create cli
const getCli = (meow) => meow(
  cliTxt,
  {
    alias,
    importMeta: import.meta // ESM required crap
  }
)
// we change the passing function from cli to serverIoCore that construct this on the root level
export function serve (meow, serverIoCore) {
  const cli = getCli(meow)
  if (!fsx.existsSync(cli.input[0])) {
    return log.error(
      'Sorry the path to your file is required! Run `server-io-core` --help for more information'
    )
  }
  const argv = cli.flags
  const dirs = cli.input[0].split(',')
  serverIoCore(
    (function () {
      let config
      // Use the config to ovewrite everything else
      if (argv.config) {
        // Now we need to check if that's a js file or json file
        const configfile = argv.config
        if (path.extname(configfile) === '.json') {
          config = fsx.readJsonSync(configfile)
        } else if (path.extname(configfile) === '.js') {
          config = require(configfile)
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
          webroot: dirs.map(d => path.resolve(d))
        }
        if (argv.port) {
          config.port = argv.port
        }
        if (argv.host) {
          config.host = argv.host
        }
        if (argv.https) {
          config.https = {
            enable: true
          }
        }
      }
      return config
    })()
  )
}
