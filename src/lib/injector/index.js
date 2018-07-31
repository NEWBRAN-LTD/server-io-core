/**
 * This is breaking out to deal with the injecting reload.js script and
 * the debugger scripts
 */
const fs = require('fs');
const { extname } = require('path');
const _ = require('lodash');
const { getFilesToInject, injectToHtml, tagJs } = require('./files-inject');
const {
  getFeatureScripts,
  renderScriptsMiddleware
} = require('./render-scripts-middleware');
const { headerParser, toArray, getDocLen } = require('../utils/helper');
const debug = require('debug')('server-io-core:inject');

/**
 * Search for the default index file
 * @param {object} config the serveStatic options
 * @return {string} path to the index file
 */
const searchIndexFile = config => {
  const { webroot, index } = config;
  const webroots = toArray(webroot);
  return webroots
    .map(d => [d, index].join('/'))
    .filter(fs.existsSync)
    .reduce((last, next) => {
      return next;
    }, null);
};

/**
 * Double check if its a HTML file
 * @param {string} file path
 * @return {boolean} or not
 */
const isHtmlFile = file => {
  const ext = extname(file).toLowerCase();
  return ext === '.html' || ext === '.htm';
};

/**
 * Breaking out the read function for the aynsc operation
 * @param {string} p path to file
 * @param {string} js tags
 * @param {string} css tags
 * @return {object} promise resolve string
 */
const getHtmlDocument = (p, js, css) => {
  return new Promise((resolver, rejecter) => {
    fs.readFile(p, (err, data) => {
      if (err) {
        return rejecter(err);
      }
      resolver(injectToHtml(data, js, css));
    });
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
            const doc = await getHtmlDocument(
              p,
              _.compact([files, js]).join('/r/n'),
              css
            );
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
