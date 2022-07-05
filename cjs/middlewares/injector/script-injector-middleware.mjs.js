'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var path = require('node:path');
var filesInject = require('./files-inject.mjs.js');
var renderScriptsMiddleware = require('./render-scripts-middleware.mjs.js');
var debug$1 = require('../../utils/debug.mjs.js');
require('../../utils/open.mjs.js');
var common = require('../../utils/common.mjs.js');
require('../../utils/config/defaults.mjs.js');
var utils = require('@jsonql/utils');

// Script injector middleware
const debug = debug$1.getDebug('inject');

/**
 * Breaking out the read function for the aynsc operation
 * @param {string} p path to file
 * @param {string} js tags
 * @param {string} css tags
 * @param {boolean} insertBefore from config
 * @return {object} promise resolve string
 */
function getHtmlDocument (p, js, css, insertBefore) {
  return common.readDocument(p).then(data => {
    if (data) {
      return filesInject.injectToHtml(data, js, css, insertBefore)
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
function searchHtmlDocuments ({ webroot, p, js, css, insertBefore }) {
  const file = common.searchFileFromFiles([p].concat(webroot.map(dir => path.join(dir, p))));
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
function scriptsInjectorMiddleware (config) {
  let scripts = [];
  const features = {
    debugger: config.debugger.enable,
    reload: config.reload.enable,
    inject: config.inject.enable
  };
  const {
    socketIoJs,
    debuggerJs,
    stacktraceJsFile,
    reloadJs
  } = renderScriptsMiddleware.getFeatureScripts(
    config
  );
  if (features.debugger || features.reload) {
    scripts.push(socketIoJs);
  }
  if (features.debugger) {
    // @TODO if they change the debugger config
    // we might have to do additional checks here just in case
    scripts = scripts.concat([stacktraceJsFile, debuggerJs]);
  }
  if (features.reload) {
    // @2018-05-14 using our new reload method
    scripts.push(reloadJs);
  }
  const files = filesInject.tagJs(scripts);
  // Next we add the fileInjector function here
  const { js, css } = filesInject.getFilesToInject(config.inject);
  if (config.inject.enable) {
    debug('getFilesToInject', js, css);
  }
  const contentType = 'text/html';
  // Export the middleware
  return async function middleware (ctx, next) {
    if (ctx.method === 'GET') {
      if (common.headerParser(ctx.request, contentType)) {
        const isHtmlDoc =
          ctx.path === '/'
            ? common.searchIndexFile(config)
            : common.isHtmlFile(ctx.path)
              ? ctx.path
              : false;
        if (isHtmlDoc) {
          try {
            debug('use overwrite', ctx.url, ctx.path);
            const doc = await searchHtmlDocuments({
              webroot: config.webroot,
              p: isHtmlDoc,
              js: utils.compact([files, js]).join(''),
              css: css,
              insertBefore: config.inject.insertBefore
            })
            // @1.3.0 chain to the replace
              .then(doc => filesInject.replaceContent(doc, config.inject.replace));
            /* eslint require-atomic-updates: off */
            ctx.status = 200;
            ctx.type = contentType + '; charset=utf8';
            ctx.length = common.getDocLen(doc);
            ctx.body = doc;
          } catch (err) {
            debug('get document error', err);
            ctx.throw(404, '[injector] Html file not found!');
          }
          return
        }
      }
    }
    await next();
  }
}

exports.getHtmlDocument = getHtmlDocument;
exports.scriptsInjectorMiddleware = scriptsInjectorMiddleware;
exports.searchHtmlDocuments = searchHtmlDocuments;
