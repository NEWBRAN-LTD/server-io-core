'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var path = require('node:path');
require('debug');
var constants = require('../../lib/constants.mjs.js');
require('../../utils/open.mjs.js');
var common = require('../../utils/common.mjs.js');
require('../../utils/config/defaults.mjs.js');
var helpers = require('./helpers.mjs.js');

// This is a special qunit helper to replace the external load qunit files to the local serve files
// setup
const projectRoot = process.cwd();
const dir = 'qunit';
const nodeModulesDir = path.join(projectRoot, 'node_modules', dir);
const js = 'qunit.js';
const css = 'qunit.css';
const qunitJs = [dir, js].join('/');
const qunitCss = [dir, css].join('/');

function prepareQunit (config) {
  if (config.qunit !== false) {
    return targets
      .map(file => ({
        ['/' + file]: serveQunit
      }))
      .reduce((a, b) => Object.assign(a, b), {})
  }
  return {}
}

const targets = [qunitJs, qunitCss];
// Main method
async function serveQunit (ctx, config) {
  const found = targets.filter(url => ctx.url === '/' + url);
  if (found.length > 0) {
    try {
      const file = found[0].split('/')[1];
      const target = path.join(nodeModulesDir, dir, file);
      helpers.debug('qunit target', target);
      const doc = await common.readDocument(target);
      const contentType = target.indexOf('.css') > -1 ? constants.CSS_CONTENT_TYPE : false;
      helpers.success(ctx, doc, contentType);
      return true
    } catch (e) {
      helpers.failed(ctx, e, 'search for qunit file failed');
    }
  }
}

exports.prepareQunit = prepareQunit;
exports.serveQunit = serveQunit;
exports.targets = targets;
