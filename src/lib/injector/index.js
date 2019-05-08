/**
 * This is breaking out to deal with the injecting reload.js script and
 * the debugger scripts
 */
const _ = require('lodash');
const { join } = require('path');
const { getFilesToInject, injectToHtml, tagJs } = require('./files-inject');
const {
  getFeatureScripts,
  renderScriptsMiddleware
} = require('./render-scripts-middleware');
const {
  searchIndexFile,
  isHtmlFile,
  headerParser,
  getDocLen,
  readDocument,
  searchFileFromFiles
} = require('../utils/');
const debug = require('debug')('server-io-core:inject');

/**
 * Breaking out the read function for the aynsc operation
 * @param {string} p path to file
 * @param {string} js tags
 * @param {string} css tags
 * @param {boolean} insertBefore from config
 * @return {object} promise resolve string
 */
const getHtmlDocument = function(p, js, css, insertBefore) {
  return readDocument(p).then(data => {
    if (data) {
      return injectToHtml(data, js, css, insertBefore);
    }
  });
};

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
const searchHtmlDocuments = function({ webroot, p, js, css, insertBefore }) {
  const file = searchFileFromFiles([p].concat(webroot.map(dir => join(dir, p))));
  if (file) {
    return getHtmlDocument(file, js, css, insertBefore);
  }

  throw Promise.reject(new Error(`File ${p} not found from ${webroot}`));
};

/**
 * @param {object} config the main config
 * @return {function} middleware
 * @api public
 */
exports.scriptsInjectorMiddleware = function(config) {
  let scripts = [];
  let features = {
    debugger: config.debugger.enable,
    reload: config.reload.enable,
    inject: config.inject.enable
  };
  const { socketIoJs, debuggerJs, stacktraceJsFile, reloadJs } = getFeatureScripts(
    config
  );

  debug('inject config %O', config.inject);

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

  const files = tagJs(scripts);
  // Next we add the fileInjector function here
  const { js, css } = getFilesToInject(config.inject);
  debug('getFilesToInject', js, css);
  const contentType = 'text/html';
  // Export the middleware
  return async function(ctx, next) {
    if (ctx.method === 'HEAD' || ctx.method === 'GET') {
      if (headerParser(ctx.request, contentType)) {
        const p =
          ctx.path === '/'
            ? searchIndexFile(config)
            : isHtmlFile(ctx.path)
            ? ctx.path
            : false;
        if (p) {
          try {
            debug('use overwrite', ctx.url, ctx.path);
            const doc = await searchHtmlDocuments({
              webroot: config.webroot,
              p: p,
              js: _.compact([files, js]).join(''),
              css: css,
              insertBefore: config.inject.insertBefore
            });
            ctx.status = 200;
            ctx.type = contentType + '; charset=utf8';
            ctx.length = getDocLen(doc);
            ctx.body = doc;
          } catch (err) {
            debug('get document error', err);
            ctx.throw(404, `[injector] Html file ${p} not found!`);
          }

          return;
        }
      }
    }

    await next();
  };
};

// Re-export
exports.renderScriptsMiddleware = renderScriptsMiddleware;
