/**
 * Modified from koa-static to allow us intercept the content and overwritten them
 */
/**
 * Module dependencies.
 */
const debug = require('debug')('koa-static');
const { resolve } = require('path');
const send = require('koa-send');
const { toArray } = require('../utils/helper');

/**
 * Customize version of koa-static
 * @param {object} config full options
 * @return {function} to call
 * @api public
 */
exports.serveStatic = config => {
  const dirs = toArray(config.webroot);
  const opts = { defer: true };
  if (config.index) {
    opts.index = config.index;
  }
  return app => {
    dirs.forEach(dir => {
      app.use(serve(dir, opts, config));
    });
  };
};

/**
 * Serve static files from `root`.
 * @param {String} root webroot
 * @param {Object} [opts] what to do
 * @return {Function} to call
 */
function serve(root, opts) {
  opts = Object.assign({}, opts);
  // Assert(root, 'root directory is required to serve files');
  // Options
  debug('static "%s" %j', root, opts);
  opts.root = resolve(root);
  if (opts.index !== false) opts.index = opts.index || 'index.html';

  if (!opts.defer) {
    return async function(ctx, next) {
      let done = false;

      if (ctx.method === 'HEAD' || ctx.method === 'GET') {
        try {
          done = await send(ctx, ctx.path, opts);
        } catch (err) {
          if (err.status !== 404) {
            throw err;
          }
        }
      }

      if (!done) {
        await next();
      }
    };
  }

  return async function(ctx, next) {
    await next();

    if (ctx.method !== 'HEAD' && ctx.method !== 'GET') return;
    // Response is already handled
    if (ctx.body != null || ctx.status !== 404) return // eslint-disable-line

    try {
      await send(ctx, ctx.path, opts);
    } catch (err) {
      if (err.status !== 404) {
        throw err;
      }
    }
  };
}
