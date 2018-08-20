/**
 * Break out the child and parent process here to make the index.js nicer to read
 */
const _ = require('lodash');
const chalk = require('chalk');
// Const { join } = require('path');
// const { fork } = require('child_process');
// const watcher = join(__dirname, '..', 'watcher');
const watcher = require('../watcher');
const { logutil } = require('../utils/');
const debug = require('debug')('server-io-core:watchers');
// Debug('path to external watcher', watcher);
// Main
/**
 * @param {object} config for serverReload
 * @return {function} unwatch callback
 */
module.exports = function(config) {
  if (config.enable && config.dir && _.isFunction(config.callback)) {
    const watcherInt = watcher({
      filePaths: config.dir,
      debounce: config.debounce,
      verbose: config.verbose
    });
    watcherInt.on('change', files => {
      config.callback(files);
    });
    // Return a terminal method
    return () => {
      watcherInt.emit('exit');
      // P.send({type: 'exit'});
      // Terminal this subprocess as well
      // p.kill();
      if (config.verbose) {
        logutil(chalk.yellow('[serverReload exited]'));
      }
    };
  }
  debug('Error: config didnt pass', config);
  // Return an empty method
  return () => {};
};
