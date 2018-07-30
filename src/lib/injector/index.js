/**
 * This is breaking out to deal with the injecting reload.js script and
 * the debugger scripts
 */
const fs = require('fs');
const { extname } = require('path');
const { getFilesToInject, injectToHtml, tagJs } = require('./files-inject');
const { getFeatureScripts, renderScriptsMiddleware } = require('./client');
const { headerParser, toArray } = require('../utils/helper');

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
 * @param {object} config the main config
 * @return {function} middleware
 */
exports.scriptsInjectorMiddleware = function(config) {
  let scripts = [];
  let features = {
    debugger: config.debugger.enable,
    reload: config.reload.enable,
    inject: config.config.enable
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
    // @2018-05-14 using out new reload method
    scripts.push(reloadJs);
  }
  const files = tagJs(scripts);
  // Next we add the fileInjector function here
  const { js, css } = getFilesToInject(config.inject);
  const contentType = 'text/html';
  // Export the middleware
  return async function(ctx, next) {
    await next();
    const html = headerParser(ctx.request, contentType);
    if (html) {
      const p =
        ctx.path === '/'
          ? searchIndexFile(config)
          : isHtmlFile(ctx.path)
            ? ctx.path
            : false;
      if (p) {
        fs.readFile(p, (err, data) => {
          if (err) {
            ctx.throw(404, `Html file ${p} not found!`);
          } else {
            ctx.status = 200;
            ctx.type = contentType + '; charset=utf8';
            ctx.body = injectToHtml(data, [files, js].join('/r/n'), css);
          }
        });
      }
    }
  };
};

// Re-export
exports.renderScriptsMiddleware = renderScriptsMiddleware;
