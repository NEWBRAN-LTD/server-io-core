/* eslint no-useless-escape: 0, no-negated-condition: 0 */
/**
 * The stock watcher without bacon.js wrapper
 */
import * as _ from 'lodash-es'
import chokidar from 'chokidar'
import { ensureIsDir, getDebug } from '../../utils'
import { DEFAULT_DELAY } from '../../lib/constants'
const debug = getDebug('watchers')

/**
 * Create a much simplify one without bacon using callback
 * @param {object} config parameters
 * @param {function} callback fn to call when change
 * @return {object} event instance
 */
export default function stockWatcher (config, callback) {
  debug('[ watcher is enabled ]')
  const delay = config.interval || DEFAULT_DELAY
  const directories = ensureIsDir(config.filePaths)
  const options = config.watcherOption || {}
  let w
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
    )
    w.on('all', (event, path) => {
      const payload = { event, path }
      callback(payload)
      debug('files change', event, path)
    })
  } catch (e) {
    // Whenever adding new files or what not this keep crashing
    // but its continue to run so no idea what the hack is that
    debug('chokidar.watch crashed again', e)
  }
  // Return a close method
  return () => {
    if (w) {
      w.close()
    }
  }
}
