// break out from render-scripts-middlewares
import {
  contentType
} from '../../lib/constants.mjs'
import chalk from 'chalk'
import {
  logutil,
  getDocLen,
  getDebug
} from '../../utils/index.mjs'
// for user here
export const debug = getDebug('render-scripts')
/**
 * Success output
 * @param {object} ctx koa app
 * @param {string} doc rendered html
 * @return {undefined} nothing
 */
export const success = (ctx, doc, otherContentType = false) => {
  ctx.status = 200
  ctx.type = otherContentType || contentType
  ctx.length = getDocLen(doc)
  ctx.body = doc
}

/**
 * Group all the fail call
 * @param {object} ctx koa app
 * @param {object} e Error
 * @param {string} msg to throw
 * @return {undefined} nothing
 */
export const failed = (ctx, e, msg) => {
  logutil(chalk.red(msg), chalk.yellow(e))
  ctx.throw(404, msg)
}

/**
 * @TODO caching the document
 * @NOTE perhaps we could do a in memory cache
 * @param {string} doc html
 * @return {string} html document
 */
export const getCacheVer = doc => {
  // debug('getCacheVer', doc)
  return doc
}
