/**
 * This file will only get call from the main setup process as a fork process
 * And communicate back via the subprocess.send
 */
import EventEmitter from 'node:events'
import { fork } from 'node:child_process'
import { join } from 'node:path'
import kefir from 'kefir'
import chalk from 'chalk'
import { logutil, getDebug } from '../../utils'
import { EVENT_NAME, DEFAULT_WAIT } from '../../lib/constants.mjs'
// setup
const watcherFile = join(__dirname, 'fork.mjs')
const debug = getDebug('watchers')
const lastChangeFiles = new Set()
class WatcherCls extends EventEmitter {}

// Main export
// we now return a function for stopping it
export default function watcher (config) {
  const evt = new WatcherCls()
  const props = fork(watcherFile)
  let stream
  try {
    props.send({ type: 'start', config })
    debug('[Watcher][start]', config.filePaths)
    if (config.verbose) {
      logutil(chalk.yellow('[Watcher][start]', config.filePaths))
    }
    // V1.0.3 we add back the kefir here to regulate the socket callback
    stream = kefir.stream(emitter => {
      // Listen to the channel
      props.on('message', opt => {
        if (config.verbose) {
          logutil(chalk.yellow(`[Watcher][${opt.type}]`), opt)
        }
        lastChangeFiles.add(opt)
        emitter.emit(lastChangeFiles)
      })
      // Return a unsubcribe method
      return () => {
        props.end()
      }
    })
    // Now subscribe to it with debounce
    stream.throttle(config.wait || DEFAULT_WAIT).observe({
      value (value) {
        // The value is actually the accumulated change values
        // we turn it into an array before send
        evt.emit(EVENT_NAME, Array.from(value))
        // Clear it
        lastChangeFiles.clear()
      }
    })
  } catch (e) {
    logutil('fork process crash', e)
  }
  // Exit call
  return (take = true) => {
    if (take) {
      return evt
    }
    try {
      evt.emit('exit')
      props.send('exit')
      if (typeof stream === 'function') {
        stream()
      }
    } catch (e) {
      // Don't let this break the exit call
      console.error(e)
    }
  }
}
