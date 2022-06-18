// Script injector middleware
import { join } from 'node:path'
import * as _ from 'lodash-es'
import {
  getFilesToInject,
  injectToHtml,
  tagJs,
  replaceContent
} from './files-inject.mjs'
import {
  getFeatureScripts
} from './render-scripts-middleware'
import {
  searchIndexFile,
  isHtmlFile,
  headerParser,
  getDocLen,
  readDocument,
  searchFileFromFiles,
  getDebug
} from '../../utils'
const debug = getDebug('inject')

/**
 * Breaking out the read function for the aynsc operation
 * @param {string} p path to file
 * @param {string} js tags
 * @param {string} css tags
 * @param {boolean} insertBefore from config
 * @return {object} promise resolve string
 */
export function getHtmlDocument (p, js, css, insertBefore) {
  return readDocument(p).then(data => {
    if (data) {
      return injectToHtml(data, js, css, insertBefore)
    }
    return data
  })
}

/**
 * Search the array of documents until it find the right one otherwise just
 * throw it
 * @param {object} params group together to get around the linting crap
 * @param {array} params.webroot dir
 * @param {string} params.p html
 * @param {string} params.js tags
 * @param {string} params.css tags
 * @param {boolean} params.insertBefore from config
 * @return {object} throw on not found
 */
export function searchHtmlDocuments ({ webroot, p, js, css, insertBefore }) {
  const file = searchFileFromFiles([p].concat(webroot.map(dir => join(dir, p))))
  if (file) {
    return getHtmlDocument(file, js, css, insertBefore)
  }
  throw new Error(`File ${p} not found from ${webroot}`)
}

/**
 * @param {object} config the main config
 * @return {function} middleware
 * @api public
 */
export function scriptsInjectorMiddleware (config) {
  let scripts = []
  const features = {
    debugger: config.debugger.enable,
    reload: config.reload.enable,
    inject: config.inject.enable
  }
  const {
    socketIoJs,
    debuggerJs,
    stacktraceJsFile,
    reloadJs
  } = getFeatureScripts(
    config
  )
  if (features.debugger || features.reload) {
    scripts.push(socketIoJs)
  }
  if (features.debugger) {
    // @TODO if they change the debugger config
    // we might have to do additional checks here just in case
    scripts = scripts.concat([stacktraceJsFile, debuggerJs])
  }
  if (features.reload) {
    // @2018-05-14 using our new reload method
    scripts.push(reloadJs)
  }
  const files = tagJs(scripts)
  // Next we add the fileInjector function here
  const { js, css } = getFilesToInject(config.inject)
  if (config.inject.enable) {
    debug('getFilesToInject', js, css)
  }
  const contentType = 'text/html'
  // Export the middleware
  return async function middleware (ctx, next) {
    if (ctx.method === 'HEAD' || ctx.method === 'GET') {
      if (headerParser(ctx.request, contentType)) {
        const isHtmlDoc =
          ctx.path === '/'
            ? searchIndexFile(config)
            : isHtmlFile(ctx.path)
              ? ctx.path
              : false
        if (isHtmlDoc) {
          try {
            debug('use overwrite', ctx.url, ctx.path)
            const doc = await searchHtmlDocuments({
              webroot: config.webroot,
              p: isHtmlDoc,
              js: _.compact([files, js]).join(''),
              css: css,
              insertBefore: config.inject.insertBefore
            })
            // @1.3.0 chain to the replace
              .then(doc => replaceContent(doc, config.inject.replace))
            /* eslint require-atomic-updates: off */
            ctx.status = 200
            ctx.type = contentType + '; charset=utf8'
            ctx.length = getDocLen(doc)
            ctx.body = doc
          } catch (err) {
            debug('get document error', err)
            ctx.throw(404, `[injector] Html file ${p} not found!`)
          }
          return
        }
      }
    }
    await next()
  }
}
