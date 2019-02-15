/**
 * This is breaking out to deal with the injecting reload.js script and
 * the debugger scripts
 */
const _ = require('lodash');
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
  readDocument
} = require('../utils/');
const debug = require('debug')('server-io-core:inject');

/**
 * Breaking out the read function for the aynsc operation
 * @param {string} p path to file
 * @param {string} js tags
 * @param {string} css tags
 * @return {object} promise resolve string
 */
const getHtmlDocument = (p, js, css) => {
  return readDocument(p).then(data => {
    if (data) {
      return injectToHtml(data, js, css);
    }
  });
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
            const doc = await getHtmlDocument(p, _.compact([files, js]).join(''), css);
            ctx.status = 200;
            ctx.type = contentType + '; charset=utf8';
            ctx.length = getDocLen(doc);
            ctx.body = doc;
          } catch (err) {
            debug('get document error', err);
            ctx.throw(404, `Html file ${p} not found!`);
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
