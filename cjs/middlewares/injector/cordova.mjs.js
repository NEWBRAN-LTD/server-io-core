'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('node:path');
require('debug');
var constants = require('../../lib/constants.mjs.js');
require('../../utils/open.mjs.js');
var common = require('../../utils/common.mjs.js');
require('../../utils/config/defaults.mjs.js');
var utils = require('@jsonql/utils');
var helpers = require('./helpers.mjs.js');
var templates_tpl = require('./templates.tpl.mjs.js');

// move out from the render-scripts-middleware
// if this is enable then return the mapped object
function prepareCordova (config) {
  if (config.cordova !== false) {
    const cordovaTargets = targets
      .map(file => ({ ['/' + file]: serveCordova }))
      .reduce((a, b) => Object.assign(a, b), {});
    return cordovaTargets
  }
  return {}
}

const targets = [constants.cordovaJs];
// main method
async function serveCordova (ctx, config) {
  if (ctx.url === '/' + constants.cordovaJs) {
    if (config.cordova === true) {
      helpers.success(ctx, templates_tpl.cordovaTpl);
      return true
    }
    if (utils.isString(config.cordova)) {
      try {
        helpers.success(ctx, await common.readDocument(config.cordova));
        return true
      } catch (e) {
        helpers.failed(ctx, e, config.cordova + ' Not found!');
      }
    }
  }
}

exports.prepareCordova = prepareCordova;
exports.serveCordova = serveCordova;
exports.targets = targets;
