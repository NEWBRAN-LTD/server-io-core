/**
 * Continue to inject dependencies (CSS,js) files etc
 */
/*
 ## Inject

 *New @ 1.4.0* This is an end user request, to add the injection. The configuration option as follow:

 ```js
   const gulpServerIo = require('gulp-server-io');
   const config = {
     inject: {
       source: ['../src/js/*.js', '../src/css/*.css'],
       target: ['index.html', 'other.html', '404.html']
     }
   }
   gulp('src').pipe(
     gulpServerIo(config)
   );
 ```

 Note about the source

 The middleware will check the pattern you provide, if there is any `*` in it. Then we use
 `glob` to fetch the list of files.

 For those that don't have `*` then it will just inject as-is.

 Also you can specify where you want to inject the files. The default is files with `.css` extension
 will be inject after the opening `<head>` tag, and `.js` extension files will be inject into
 the bottom before the closing `</body>` tag.
 Any other file extension will get throw out (we don't suport custom tag yet, might be in the future)

 To inject files where you want, pass as an object instead

 ```js
  const config = {
    inject: {
      source: {
        head: ['list/of/files.js', '/list/of/*.css'],
        body: ['list/of/other/files.js']
      },
      target: ['index.html', 'other.html']
    }
  }
 ```

 By default the target will be `index.html`, if you don't need to inject files into anywhere else
 you can just omit it. Otherwise, you will need to list all the HTML document that you need to inject
 files to.

 */
const { logutil } = require('../utils/helper');
const _ = require('lodash');
const cheerio = require('cheerio');
const glob = require('glob');
const chalk = require('chalk');
const debug = require('debug')('server-io-core:inject');

/**
 * @param {array} files to wrap with tag
 * @param {string} ignorePath to strip out
 * @return {string} conccat them all
 */
const tagCss = (files, ignorePath) => {
  return files
    .map(file => {
      if (ignorePath) {
        file = file.replace(ignorePath, '');
      }
      return `<link rel="stylesheet" href="${file}" />`;
    })
    .join('\r\n');
};
/**
 * @param {array} files to wrap with tag
 * @param {string} ignorePath to strip out
 * @return {string} conccat them all
 */
const tagJs = (files, ignorePath) => {
  return files
    .map(file => {
      if (ignorePath) {
        file = file.replace(ignorePath, '');
      }
      return `<script type="text/javascript" src="${file}" defer></script>`;
    })
    .join('\r\n');
};

/**
 * @param {string} source to process
 * @return {array} result
 */
const processFiles = source => {
  let files = [];
  if (source.indexOf('*') > -1) {
    files = files.concat(glob.sync(source));
  } else {
    files = files.concat([source]);
  }
  return files;
};

/**
 * @param {strimg} name file
 * @return {boolean} true found css
 */
const isCss = name => {
  return name.toLowerCase().substr(-3) === 'css';
};

/**
 * @param {string} name file
 * @return {boolean} true found js
 */
const isJs = name => {
  return name.toLowerCase().substr(-2) === 'js';
};

/**
 * @param {mixed} source array or object
 * @return {object} js / css
 */
const getSource = source => {
  let js = [];
  let css = [];
  if (source) {
    source = Array.isArray(source) ? source : [source];
    // Processing the object
    for (let i = 0, len = source.length; i < len; ++i) {
      let s = source[i];
      if (isCss(s)) {
        css = css.concat(processFiles(s));
      } else if (isJs(s)) {
        js = js.concat(processFiles(s));
      }
    }
    /*
    @TODO
    else if (typeof source === 'object') { // expect head of bottom!

    } */
  }
  return {
    js: js.length ? js : false,
    css: css.length ? css : false
  };
};

/**
 * Prepare the css / js array to inject
 * @param {object} config the config.inject properties
 * @return {object} for use
 */
exports.getFilesToInject = function(config) {
  // @2018-05-07 disbale this check because we couldn't get the fileanme from the middleware
  // const target = getTarget(config.target);
  const { js, css } = getSource(config.source);
  // @2018-07-30 now only return the tagged items
  let files = {};
  // Const check = target && (js || css);
  if (!js || !css) {
    // Display an error inline here
    const msg = '[inject] Configuration is incorrect for inject to work!';
    debug('injector error', msg);
    logutil(chalk.red(msg), config);
    return files;
  }
  return {
    js: tagJs(js, config.ignorePath),
    css: tagCss(css, config.ignorePath)
  };
};

/**
 * @param {string} body rendered html
 * @param {array} js of tag javascripts
 * @param {array} css of tag CSS
 * @return {string} overwritten HTML
 */
exports.injectToHtml = (body, js, css) => {
  const html = _.isString(body) ? body : body.toString('utf8');
  const $ = cheerio.load(html);
  $('head').append(js);
  $('body').append(css);
  return $.html();
};
// Re-export for re-use
exports.tagJs = tagJs;
