// This will be the gulp interface
// const serverIoCoreGulp = require('server-io-core/gulp')
const through = require('through2');
const serverIoCore = require('./');
// @TODO
module.exports = function(options = {}) {
  const stream = through
    .obj((file, enc, callback) => {
      // Serve up the files
      app.use(config.path, serveStatic(file.path, config));
      filePaths.push(file.path);
      callback();
      debug('[main][add file]', filePaths);
    })
    .on('data', f => {
      filePaths.push(f.path);
      debug('[main][data add file]', filePaths);
    })
    .on('end', () => {
      debug('[main][on end]', filePaths);
    });
  stream.on('kill', () => {
    // @1.4.0-beta.11 change to array
    unwatchFn.forEach(fn => fn());
    // Explicitly close the express server
    server.close(() => {
      if (io && io.server && io.server.close) {
        // Close the socket.io server
        io.server.close();
      }
    });
    // Close the mock server
    mockServerInstance.close();
  });

  // Return
  return stream;
};
