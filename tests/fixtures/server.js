// Just setup the server for reuse later
const serverIoCore = require('../../index');
const { join } = require('path');
const _ = require('lodash');
// Return
module.exports = function(extra = {}) {
  return serverIoCore(
    _.extend(
      {
        debugger: false,
        reload: false,
        open: false,
        webroot: join(__dirname, 'demo', 'dist', 'base')
      },
      extra
    )
  );
};
