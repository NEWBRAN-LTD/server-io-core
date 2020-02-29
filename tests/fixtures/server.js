// Just setup the server for reuse later
const serverIoCore = require('../../index')
const { join } = require('path')

// Return
module.exports = function(extra = {}) {
  return serverIoCore(
    Object.assign(
      {
        socket: false,
        debugger: false,
        reload: false,
        open: false,
        webroot: join(__dirname, 'demo', 'dist', 'base')
      },
      extra
    )
  )
}
