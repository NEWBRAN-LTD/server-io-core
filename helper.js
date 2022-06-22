'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var glob = require('glob');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var glob__default = /*#__PURE__*/_interopDefaultLegacy(glob);

// export extra methods to help with other things
/** just a wrapper of glob to make it async */
async function searchFiles (dest) {
  return new Promise((resolve, reject) => {
    glob__default["default"](dest, function (err, files) {
      if (err || !files.length) {
        return reject(err)
      }
      resolve(files);
    });
  })
}

exports.searchFiles = searchFiles;
