/**
 * This file will only get call from the main setup process as a fork process
 * And communicate back via the subprocess.send
 */
const EventEmitter = require('events');
const { fork } = require('child_process');
const { join } = require('path');
const { logutil } = require('../utils/');
const chalk = require('chalk');
// Const stockWatcher = require('./stock-watcher');
const watcherFile = join(__dirname, 'fork.js');
class WatcherCls extends EventEmitter {}
const debug = require('debug')('gulp-webserver-io:watchers');

module.exports = function(config) {
  const evt = new WatcherCls();
  const props = fork(watcherFile);
  try {
    props.send({ type: 'start', config });
    debug('[Watcher][start]', config.filePaths);
    if (config.verbose) {
      logutil(chalk.yellow('[Watcher][start]', config.filePaths));
    }

    // Listen to the channel
    props.on('message', opt => {
      if (config.verbose) {
        logutil(chalk.yellow(`[Watcher][${opt.type}]`), opt);
      }

      evt.emit(opt.type, opt);
    });
  } catch (e) {
    logutil('fork process crash', e);
  }

  return evt;
};
