/* eslint no-useless-escape: 0, no-negated-condition: 0 */
/**
 * The stock watcher without bacon.js wrapper
 */
const _ = require('lodash');
const chokidar = require('chokidar');
const { ensureIsDir } = require('../utils/helper');
const debug = require('debug')('gulp-server-io:watchers');
// Create a new class to use
const DEFAULT_DELAY = 500;
/**
 * Create a much simplify one without bacon using callback
 * @param {object} config parameters
 * @param {function} callback fn to call when change
 * @return {object} event instance
 */
module.exports = function(config, callback) {
  const delay = config.debounce || config.interval || DEFAULT_DELAY;
  const directories = ensureIsDir(config.filePaths);
  const options = config.watcherOption || {};
  debug('watching directories', directories);
  const w = chokidar.watch(
    directories,
    _.extend(
      {
        // ignored: /(^|[\/\\])\../,
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
  // Return a close method
  return () => {
    w.close();
  };
};
