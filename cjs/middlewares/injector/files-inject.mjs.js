'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var cheerio = require('cheerio');
var glob = require('glob');
var fsx = require('fs-extra');
var debug$1 = require('../../utils/debug.mjs.js');
require('../../utils/open.mjs.js');
var common = require('../../utils/common.mjs.js');
require('../../utils/config/defaults.mjs.js');
var utils = require('@jsonql/utils');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var cheerio__default = /*#__PURE__*/_interopDefaultLegacy(cheerio);
var glob__default = /*#__PURE__*/_interopDefaultLegacy(glob);
var fsx__default = /*#__PURE__*/_interopDefaultLegacy(fsx);

// Inject dependencies (CSS,js) files etc

const debug = debug$1.getDebug('files-inject');

/**
 * combine the two tagging method together
 * @param {string} type css / js
 * @param {string} file file to insert
 * @param {string} [ignorePath=''] optional to ignore the path
 * @return {string} tagged version
 */
const tagFile = (type, file, ignorePath) => {
  if (ignorePath) {
    if (ignorePath) {
      file = file.replace(ignorePath, '');
    }
  }
  if (type === 'css') {
    return `<link rel="stylesheet" href="${file}" />`
  }
  return `<script type="text/javascript" src="${file}" defer></script>`
};

/**
 * @param {array} files to wrap with tag
 * @param {string} ignorePath to strip out
 * @return {string} conccat them all
 */
const tagJs = (files, ignorePath) => {
  return files.map(file => tagFile('js', file, ignorePath)).join('\r\n')
};

/**
 * @param {string} source to process
 * @return {array} result
 */
const processFiles = source => {
  let files = [];
  if (source.indexOf('*') > -1) {
    files = files.concat(glob__default["default"].sync(source));
  } else {
    files = files.concat([source]);
  }
  return files
};

/**
 * @param {strimg} name file
 * @return {boolean} true found css
 */
const isCss = name => {
  return name.toLowerCase().substr(-3) === 'css'
};

/**
 * @param {string} name file
 * @return {boolean} true found js
 */
const isJs = name => {
  return name.toLowerCase().substr(-2) === 'js'
};

/**
 *
 * @param {object} source from config
 * @param {string} key head or body
 * @return {array} always array even empty
 */
const extractFromSource = (source, key) => {
  if (source[key]) {
    const s = source[key];
    return Array.isArray(s) ? s : [s]
  }
  return []
};

/**
 * @param {object} config the inject configuration object
 * @return {object} js<Array> css<Array>
 */
const getSource = config => {
  let js = [];
  let css = [];
  const { target, source } = config;
  // If they pass a non array then it will get ignore!
  if (source && Array.isArray(source) && source.length) {
    // Processing the object
    for (let i = 0, len = source.length; i < len; ++i) {
      const s = source[i];
      if (isCss(s)) {
        css = css.concat(processFiles(s));
      } else if (isJs(s)) {
        js = js.concat(processFiles(s));
      }
    }
  }

  if (
    (target.head && Array.isArray(target.head) && target.head.length) ||
    (target.body && Array.isArray(target.body) && target.body.length)
  ) {
    // Expect head of bottom!
    // it's pretty simple actually those with head in css
    // those with body in js and that's it
    css = css.concat(extractFromSource(target, 'head'));
    js = js.concat(extractFromSource(target, 'body'));
  }
  return { js, css }
};

/**
 * Combine function
 * @param {string} file to target
 * @param {string} ignorePath path to ignore and strip out
 * @return {string} tagged file
 */
function checkAndTagFile (file, ignorePath) {
  if (isJs(file)) {
    return tagFile('js', file, ignorePath)
  }
  if (isCss(file)) {
    return tagFile('css', file, ignorePath)
  }
  throw new Error('It must be js or css file!')
}

/**
 * New option in 1.0.10 pass the processor function
 * to run through the js before we pass to the tagging
 * @param {object} config configuration
 * @param {array} js the list of js files
 * @return {array} the list of js files
 */
function getProcessor (config, js) {
  const { processor } = config;
  if (processor && typeof processor === 'function') {
    const result = Reflect.apply(processor, null, [js]);
    if (!Array.isArray(result)) {
      throw new Error('Expect your processor to return an array of javascript files!')
    }
    return result
  }

  return js
}

/**
 * Prepare the css / js array to inject
 * @param {object} config the config.inject properties
 * @return {object} js<string> css<string>
 */
const getFilesToInject = function (config) {
  // @2018-05-07 disbale this check because we couldn't get the fileanme from the middleware
  // const target = getTarget(config.target);
  const { js, css } = getSource(config);
  // Const check = target && (js || css);
  if (!js.length && !css.length) {
    // Both should have at least one have properties!
    if (config.enable) {
      // Display an error inline here
      const msg = '[inject] Configuration is incorrect for injector to work!';
      debug('injector error', msg);
      common.logutil(msg, config);
    }
    return { js: '', css: '' }
  }
  const br = '\r\n';
  return {
    js: getProcessor(config, js)
      .map(j => checkAndTagFile(j, config.ignorePath))
      .join(br) + br,
    css: css.map(c => checkAndTagFile(c, config.ignorePath)).join(br) + br
  }
};

/**
 * @TODO add the before / after parameter
 * @TODO add insertBefore / insertAfter in to config
 * @param {string} body rendered html
 * @param {array} jsTags of tag javascripts
 * @param {array} cssTags of tag CSS
 * @param {boolean} before true new configuration option
 * @return {string} overwritten HTML
 */
const injectToHtml = (body, jsTags, cssTags, before = true) => {
  const html = utils.isString(body) ? body : body.toString('utf8');
  const $ = cheerio__default["default"].load(html);
  // @2018-08-13 add check if there is existing javascript tags
  const $scripts = $('body script').toArray();
  if (jsTags) {
    if ($scripts.length) {
      if (before) {
        $($scripts[0]).before(jsTags);
      } else {
        $($scripts[$scripts.length - 1]).after(jsTags);
      }
    } else {
      $('body').append(jsTags);
    }
  }
  if (cssTags) {
    $('head').append(cssTags);
  }
  return $.html()
};

/**
 * 1.3.0 add replace option, expecting keys are
 * - target: a string tag
 * - replace: a string to replace with
 * - file (optional): we will try to read the file and use the content to replace it
 * - all (optional): replace every single one or not (false by default)
 * @param {string} html the html document
 * @param {array} replace array of the above mentioned object
 * @return {string} the replaced html document
 */
const replaceContent = (html, replace) => {
  if (Array.isArray(replace) && replace.length > 0) {
    return replace.reduce((text, opt) => {
      const { target, str, file, all } = opt;
      const g = all !== false; // Unless set otherwise always replace global
      if (target) {
        let toReplace = '';
        if (file && fsx__default["default"].existsSync(file)) {
          toReplace = fsx__default["default"].readFileSync(file, { encoding: 'utf8' });
        } else if (str) {
          toReplace = str;
        }
        if (g) {
          const regex = new RegExp(target, 'g');
          return text.replace(regex, toReplace)
        }
        return text.replace(target, replace)
      }
      return text
    }, html)
  }
  return html
};

exports.checkAndTagFile = checkAndTagFile;
exports.extractFromSource = extractFromSource;
exports.getFilesToInject = getFilesToInject;
exports.getProcessor = getProcessor;
exports.getSource = getSource;
exports.injectToHtml = injectToHtml;
exports.isCss = isCss;
exports.isJs = isJs;
exports.processFiles = processFiles;
exports.replaceContent = replaceContent;
exports.tagFile = tagFile;
exports.tagJs = tagJs;
