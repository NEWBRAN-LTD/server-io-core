// V1.0.2
// We create a custom namespace that allow a third party module to call it
// then pass a callback to handle this calls
// also pass this to the callback for the developer to use
const socketIoClient = require('socket.io-client');
const { isString, isFunction } = require('lodash');

module.exports = function(io, namespace) {
  const ctn = namespace.length;
  for (let i = 0; i < ctn; ++i) {
    let { path, callback } = namespace[i];
    if (path && isString(path) && callback && isFunction(callback)) {
      let nsp = io.of(path);
      callback(nsp, io, socketIoClient);
    }
  }
};
