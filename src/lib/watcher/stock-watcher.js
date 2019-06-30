/* eslint no-useless-escape: 0, no-negated-condition: 0 */
/**
 * The stock watcher without bacon.js wrapper
 */
const _ = require('lodash');
const chokidar = require('chokidar');
const { ensureIsDir } = require('../utils/');
const debug = require('debug')('server-io-core:watchers');
const { DEFAULT_DELAY } = require('../reload/constants');
/**
 * Create a much simplify one without bacon using callback
 * @param {object} config parameters
 * @param {function} callback fn to call when change
 * @return {object} event instance
 */
module.exports = function(config, callback) {
  debug('[ watcher is enabled ]');
  const delay = config.interval || DEFAULT_DELAY;
  const directories = ensureIsDir(config.filePaths);
  const options = config.watcherOption || {};
  let w;
  // Debug('watching directories', directories);
  try {
    w = chokidar.watch(
      directories,
      _.extend(
        {
          ignoreInitial: true,
          interval: delay
        },
        options
      )
    );
    w.on('all', (e, p) => {
      debug('files change', e, p);
      callback({ event: e, path: p });
    });
  } catch (e) {
    // Whenever adding new files or what not this keep crashing
    // but its continue to run so no idea what the hack is that
    debug('chokidar.watch crashed again', e);
  }

  // Return a close method
  return () => {
    if (w) {
      w.close();
    }
  };
};
