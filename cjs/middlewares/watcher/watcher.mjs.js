'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var EventEmitter = require('node:events');
var node_child_process = require('node:child_process');
var path = require('node:path');
var kefir = require('kefir');
var debug$1 = require('../../utils/debug.mjs.js');
require('../../utils/open.mjs.js');
var constants = require('../../lib/constants.mjs.js');
var common = require('../../utils/common.mjs.js');
require('../../utils/config/defaults.mjs.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var EventEmitter__default = /*#__PURE__*/_interopDefaultLegacy(EventEmitter);
var kefir__default = /*#__PURE__*/_interopDefaultLegacy(kefir);

/**
 * This file will only get call from the main setup process as a fork process
 * And communicate back via the subprocess.send
 */
// setup
const __dirname$1 = common.getDirname((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('middlewares/watcher/watcher.mjs.js', document.baseURI).href)));
const watcherFile = path.join(__dirname$1, 'fork.mjs');
const debug = debug$1.getDebug('watchers');
const lastChangeFiles = new Set();
class WatcherCls extends EventEmitter__default["default"] {}

// Main export
// we now return a function for stopping it
function watcherGenerator (config) {
  const evt = new WatcherCls();
  const props = node_child_process.fork(watcherFile);
  let stream;
  try {
    props.send({ type: 'start', config });
    debug('[Watcher][start]', config.filePaths);
    if (config.verbose) {
      common.logutil('[Watcher][start]', config.filePaths);
    }
    // V1.0.3 we add back the kefir here to regulate the socket callback
    stream = kefir__default["default"].stream(emitter => {
      // Listen to the channel
      props.on('message', opt => {
        if (config.verbose) {
          common.logutil(`[Watcher][${opt.type}]`, opt);
        }
        lastChangeFiles.add(opt);
        emitter.emit(lastChangeFiles);
      });
      // Return a unsubcribe method
      return () => {
        props.end();
      }
    });
    // Now subscribe to it with debounce
    stream.throttle(config.wait || constants.DEFAULT_WAIT).observe({
      value (value) {
        // The value is actually the accumulated change values
        // we turn it into an array before send
        evt.emit(constants.EVENT_NAME, Array.from(value));
        // Clear it
        lastChangeFiles.clear();
      }
    });
  } catch (e) {
    common.logutil('fork process crash', e);
  }
  // Exit call
  return (take = true) => {
    if (take) {
      return evt
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
  }
}

exports.watcherGenerator = watcherGenerator;
