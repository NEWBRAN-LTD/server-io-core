/**
 * This is breaking out to deal with the injecting reload.js script and
 * the debugger scripts
 */
const scriptInject = require('./script-inject');
const filesInject = require('./files-inject');
const clientMiddleware = require('./client');
/**
 * @param {object} features toggle
 * @param {object} config the main config
 * @return {function} middleware
 */
exports.scriptsInjector = function(features, config) {
  let scripts = [];
  if (features.debugger || features.reload) {
    scripts.push('/socket.io/socket.io.js');
  }
  if (features.debugger) {
    // @TODO if they change the debugger config
    // we might have to do additional checks here just in case
    scripts = scripts.concat([
      [config.debugger.namespace, 'stacktrace.js'].join('/'),
      [config.debugger.namespace, config.debugger.js].join('/')
    ]);
  }
  if (features.reload) {
    // @2018-05-14 using out new reload method
    scripts.push([config.reload.namespace, config.reload.js].join('/'));
  }
  // The script should wait until everything are all done and settle
  return scriptInject({
    snippet: scripts
      .map(s => `<script type="text/javascript" src="${s}" defer></script>`)
      .reduce((a, b) => [a, b].join('\r\n'), '')
  });
};

exports.filesInjector = function(config) {
  return filesInject(config);
};

exports.clientMiddleware = clientMiddleware;
