/**
 * Modified from koa-static to allow us intercept the content and overwritten them
 */
import send from 'koa-send'
import { toArray, getDebug } from '../utils/index.mjs'
const debug = getDebug('static-serve')
/**
 * Customize version of koa-static
 * @param {object} app the Koa instance
 * @param {object} config full options
 * @return {function} to call
 * @api public
 */
export default function serverStatic (app, config) {
  const dirs = toArray(config.webroot)
  const opts = { defer: true }
  if (config.index) {
    opts.index = config.index
  }
  // V.2 we just run through it
  dirs.forEach(dir => {
    app.use(serve(dir, opts, config))
  })
}
/**
 * Serve static files from `root`.
 * @param {String} root webroot
 * @param {Object} [opts] what to do
 * @return {Function} to call
 */
function serve (root, opts) {
  opts = Object.assign({}, opts)
  // Assert(root, 'root directory is required to serve files');
  // Options
  // debug('static "%s" %j', root, opts);
  opts.root = root
  if (opts.index !== false) {
    opts.index = opts.index || 'index.html'
  }
  if (!opts.defer) {
    return async function middleware (ctx, next) {
      let done = false
      if (ctx.method === 'HEAD' || ctx.method === 'GET') {
        try {
          done = await send(ctx, ctx.path, opts)
        } catch (err) {
          if (err.status !== 404) {
            debug('Unknown error', err)
            throw err
          }
        }
      }
      if (!done) {
        await next()
      }
    }
  }
  return async function middleware (ctx, next) {
    await next()
    let exit = false
    // Check certain method
    if (ctx.method !== 'HEAD' && ctx.method !== 'GET') {
      exit = true
    }
    // Response is already handled
    // @bug from Koa ctx.body is undefined not null
    if ((ctx.body !== undefined && ctx.body !== null) || ctx.status !== 404) {
      exit = true
    }
    if (exit) {
      return false
    }
    try {
      await send(ctx, ctx.path, opts)
    } catch (err) {
      if (err.status !== 404) {
        throw err
      }
    }
  }
}
