/**
 * This file will only get call from the main setup process as a fork process
 * And communicate back via the subprocess.send
 */
const EventEmitter = require('events');
const { fork } = require('child_process');
const { join } = require('path');
const kefir = require('kefir');
const chalk = require('chalk');
const { logutil } = require('../utils/');
// Const stockWatcher = require('./stock-watcher');
const watcherFile = join(__dirname, 'fork.js');
class WatcherCls extends EventEmitter {}
const debug = require('debug')('gulp-webserver-io:watchers');
const { EVENT_NAME, DEFAULT_WAIT } = require('../reload/constants');
let lastChangeFiles = new Set();
// Main export
// we now return a function for stopping it
module.exports = function(config) {
  const evt = new WatcherCls();
  const props = fork(watcherFile);
  let stream;
  try {
    props.send({ type: 'start', config });
    debug('[Watcher][start]', config.filePaths);
    if (config.verbose) {
      logutil(chalk.yellow('[Watcher][start]', config.filePaths));
    }

    // V1.0.3 we add back the kefir here to regulate the socket callback
    stream = kefir.stream(emitter => {
      // Listen to the channel
      props.on('message', opt => {
        if (config.verbose) {
          logutil(chalk.yellow(`[Watcher][${opt.type}]`), opt);
        }

        lastChangeFiles.add(opt);
        emitter.emit(lastChangeFiles);
      });
      // Return a unsubcribe method
      return () => {
        props.end();
      };
    });
    // Now subscribe to it with debounce
    stream.throttle(config.wait || DEFAULT_WAIT).observe({
      value(value) {
        // The value is actually the accumulated change values
        // we turn it into an array before send
        evt.emit(EVENT_NAME, Array.from(value));
        // Clear it
        lastChangeFiles.clear();
      }
    });
  } catch (e) {
    logutil('fork process crash', e);
  }

  // Exit call
  return (take = true) => {
    if (take) {
      return evt;
    }

    try {
      evt.emit('exit');
      props.send('exit');
      if (typeof stream === 'function') {
        stream();
      }
    } catch (e) {
      // Don't let this break the exit call
      console.error(e);
    }
  };
};
