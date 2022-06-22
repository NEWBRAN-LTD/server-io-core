// This will be the rollup interface
// const serverIoCorePlugin = require('server-io-core/rollup')
import serverIoCore from './index.mjs'
// @TODO
export default function rollupServerIoCorePlugin (options = {}) {
  // Force these options on config
  const config = Object.assign(options, {
    autoStart: false, // We must overwrite this for the plugin to work
    reload: {
      enable: true,
      verbose: false
    }
  })
  // Getting the fn(s)
  const { start, stop } = serverIoCore(config)
  const signals = ['SIGINT', 'SIGTERM']
  // Listen to signal and close it
  signals.forEach(signal => {
    process.on(signal, () => {
      stop()
      process.exit()
    })
  })
  let running
  // Return
  return {
    name: 'server-io',
    generateBundle () {
      if (!running) {
        running = true
        start()
      }
    }
  }
}
