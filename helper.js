'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var node_path = require('node:path');
var glob = require('glob');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var glob__default = /*#__PURE__*/_interopDefaultLegacy(glob);

// export extra methods to help with other things

/** taken out from the searchFiles and run mutliple search */
const searchDir = (dest) => new Promise((resolve) => {
  glob__default["default"](dest, function (err, files) {
    if (err) {
      console.log('Some thing went wrong', err);
      // we don't want to reject it just let it run
      return resolve([])
      // return reject(err)
    }
    resolve(files);
  });
});

/** just grab the middlewares if any */
const getMiddlewares = (config) => {
  const { middlewares } = config;
  if (middlewares) {
    return Array.isArray(middlewares) ? middlewares : [middlewares]
  }
  return []
};

/** just a wrapper of glob to make it async */
async function searchFiles (dests) {
  return Promise
    .all(dests.map(searchDir))
    .then(results => results.flatMap(a => a))
}

/**
 * @param {object} config configuration
 * @return {object} promise resolve the config for server-io-core
 */
const getConfigForQunit = (config) => {
  const qunitDir = node_path.resolve(node_path.join(config.baseDir, 'qunit'));
  const baseDir = node_path.join(qunitDir, 'files');
  const webrootDir = node_path.join(qunitDir, 'webroot');

  return searchFiles([
    node_path.join(webrootDir, config.libFilePattern),
    node_path.join(baseDir, config.testFilePattern)
  ])
    .then(files => (
      {
        qunit: true, // MUST SET TO TRUE
        port: config.port,
        webroot: config.webroot,
        open: config.open,
        reload: config.reload,
        middlewares: getMiddlewares(config),
        // DON"T TOUCH THIS UNLESS YOU KNOW WHAT YOU ARE DOING //
        inject: {
          insertBefore: false,
          target: {
            body: files.map(file => file.replace(baseDir, ''))
          }
        }
      }
    ))
};

exports.getConfigForQunit = getConfigForQunit;
exports.searchFiles = searchFiles;
