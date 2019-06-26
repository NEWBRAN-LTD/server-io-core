// This will be the gulp interface
// const serverIoCoreGulp = require('server-io-core/gulp')
const through = require('through2');
const serverIoCore = require('./');
const debug = require('debug')('server-io-core:gulp');
// @TODO
module.exports = function(options = {}) {
  // Need to get the correct config at this point
  let filePaths = [];
  const stream = through
    .obj((file, enc, callback) => {
      // Serve up the files
      // app.use(config.path, serveStatic(file.path, config));
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
    // Call the stop method here
  });

  // Return
  return stream;
};
