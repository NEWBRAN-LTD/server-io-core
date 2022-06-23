'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var constants = require('../../lib/constants.mjs.js');
var debug$1 = require('../../utils/debug.mjs.js');
require('../../utils/open.mjs.js');
var common = require('../../utils/common.mjs.js');
require('../../utils/config/defaults.mjs.js');

// break out from render-scripts-middlewares
// for user here
const debug = debug$1.getDebug('render-scripts');
/**
 * Success output
 * @param {object} ctx koa app
 * @param {string} doc rendered html
 * @return {undefined} nothing
 */
const success = (ctx, doc, otherContentType = false) => {
  ctx.status = 200;
  ctx.type = otherContentType || constants.contentType;
  ctx.length = common.getDocLen(doc);
  ctx.body = doc;
};

/**
 * Group all the fail call
 * @param {object} ctx koa app
 * @param {object} e Error
 * @param {string} msg to throw
 * @return {undefined} nothing
 */
const failed = (ctx, e, msg) => {
  common.logutil(msg, e);
  ctx.throw(404, msg);
};

/**
 * @TODO caching the document
 * @NOTE perhaps we could do a in memory cache
 * @param {string} doc html
 * @return {string} html document
 */
const getCacheVer = doc => {
  // debug('getCacheVer', doc)
  return doc
};

exports.debug = debug;
exports.failed = failed;
exports.getCacheVer = getCacheVer;
exports.success = success;
