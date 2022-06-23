/**
 * This will combine debugger and reload client file overwrite in one place
 * there will be just one middleware to handle them
 */
import fs from 'node:fs'
import { join } from 'node:path'
import {
  getSocketConnectionConfig,
  readDocument,
  template,
  getDirname
} from '../../utils/index.mjs'
import {
  stacktraceName,
  dummyJs
} from '../../lib/constants.mjs'
import {
  debug,
  success,
  failed,
  getCacheVer
} from './helpers.mjs'
import { reloadTpl } from '../reload/index.mjs'
import { debuggerClientTpl } from '../debugger/index.mjs'
import { prepareCordova } from './cordova.mjs'
import { prepareQunit } from './qunit.mjs'
// get where are we
const __dirname = getDirname(import.meta.url)
/**
 * Get scripts paths
 * @param {object} config the main config object
 * @return {object} parse file paths
 */
export const getFeatureScripts = function (config) {
  // @TODO this will be replace with ws next
  const socketIoJs = '/socket.io/socket.io.js'
  // Debugger
  const debuggerPath = config.debugger.namespace
  const eventName = config.debugger.eventName
  const debuggerJs = [debuggerPath, config.debugger.js].join('/')
  const stacktraceJsFile = [debuggerPath, stacktraceName].join('/')
  // Reload
  const reloadPath = config.reload.namespace
  const reloadEventName = config.reload.eventName
  const reloadJs = [reloadPath, config.reload.js].join('/')
  // Return
  return {
    debuggerPath,
    eventName,
    reloadPath,
    reloadEventName,
    socketIoJs,
    debuggerJs,
    stacktraceJsFile,
    reloadJs
  }
}

/**
 * Find the stack track file
 * @return {string} path to stacktrace file
 */
export const searchStacktraceSrc = () => {
  // @NOTE this is problematic
  const stacktraceFile = join(
    'node_modules',
    'stacktrace-js',
    'dist',
    'stacktrace-with-promises-and-json-polyfills.js'
  )
  return [join(__dirname, '..', '..', '..', stacktraceFile), stacktraceFile]
    .filter(f => {
      return fs.existsSync(f)
    })
    .reduce((first, next) => {
      return next
    }, null)
}

/**
 * Allow user supply overwrite files
 * @param {object} ctx koa
 * @param {object} config options
 * @return {boolean} true has false not
 */
export async function hasExtraVirtualOverwrite (ctx, config) {
  const features = [prepareCordova, prepareQunit]
    .map(fn => fn(config))
    .reduce((a, b) => Object.assign(a, b), {})
  const key = ctx.url
  if (features[key]) {
    return await features[key](ctx, config)
  }
  return false
}

/**
 * This become a standalone middleware and always going to inject to the app
 * @param {object} config the main config object
 * @return {undefined} nothing
 * @api public
 */
export function renderScriptsMiddleware (config) {
  const {
    debuggerPath,
    eventName,
    reloadPath,
    reloadEventName,
    debuggerJs,
    stacktraceJsFile,
    reloadJs
  } = getFeatureScripts(config)
  // Export middleware
  return async function middleware (ctx, next) {
    await next()
    // Only catch certain methods
    if (ctx.method === 'GET') {
      const url = ctx.url
      // debug('render-scripts-middleware', url)
      switch (url) {
        // Without the {} will get a Unexpected lexical declaration in case block  no-case-declarations
        case dummyJs: {
          debug('catch script', dummyJs)
          const body = await Promise.resolve('console.info(\'SERVER_IO_CORE\', true)')
          return success(ctx, body)
        }
        case reloadJs: {
          try {
            const body = await Promise.resolve(
              reloadTpl
            ).then(data => {
              const clientFileFn = template(data)
              const connectionOptions = getSocketConnectionConfig(config)
              return getCacheVer(
                clientFileFn({
                  reloadNamespace: reloadPath,
                  eventName: reloadEventName,
                  displayLog: config.reload.displayLog,
                  connectionOptions
                })
              )
            })
            success(ctx, body)
          } catch (e) {
            failed(ctx, e, 'Error reading io-reload-client file')
          }
          return // Terminate it
        }
        case stacktraceJsFile: {
          try {
            const body = await readDocument(searchStacktraceSrc())
            success(ctx, body)
          } catch (e) {
            failed(ctx, e, 'Error reading stacktrace source file!')
          }
          return // Terminate it
        }
        case debuggerJs: {
          try {
            const body = await Promise.resolve(
              debuggerClientTpl
            ).then(data => {
              // If they want to ping the server back on init
              const ping =
                typeof config.debugger.client === 'object' && config.debugger.client.ping
                  ? 'true'
                  : 'false'
              const serveDataFn = template(data)
              const connectionOptions = getSocketConnectionConfig(config)
              return getCacheVer(
                serveDataFn({
                  debuggerPath,
                  eventName,
                  ping,
                  connectionOptions,
                  consoleDebug: config.debugger.consoleDebug
                })
              )
            })
            return success(ctx, body)
          } catch (e) {
            failed(ctx, e, 'Error reading io-debugger-client file')
          }
          return // Terminate it
        }
        default:
          // @2018-08-20 started @2022-06-22 additional features added
          if ((await hasExtraVirtualOverwrite(ctx, config)) === true) {
            debug('catch hasExtraVirtualOverwrite')
          }
      }
    }
  }
}
