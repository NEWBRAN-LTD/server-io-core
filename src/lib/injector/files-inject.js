/**
 * Continue to inject dependencies (CSS,js) files etc
 */
/*
 ## Inject

 *New @ 1.4.0* This is an end user request, to add the injection. The configuration option as follow:

 ```js
   const gulpServerIo = require('server-io-core');
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
      target: {
        head: ['list/of/files.js', '/list/of/*.css'],
        body: ['list/of/other/files.js']
      }
    }
  }
 ```

 By default the target will be `index.html`, if you don't need to inject files into anywhere else
 you can just omit it. Otherwise, you will need to list all the HTML document that you need to inject
 files to.

 */
const { logutil } = require('../utils');
const _ = require('lodash');
const cheerio = require('cheerio');
const glob = require('glob');
const chalk = require('chalk');
const debug = require('debug')('server-io-core:inject');

/**
 * NOT IN USE
 * @param {array} files to wrap with tag
 * @param {string} ignorePath to strip out
 * @return {string} conccat them all
 */
/*
const tagCss = (files, ignorePath) => {
  return files
    .map(file => tagFile('css', file, ignorePath))
    .join('\r\n');
};
*/
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
    return `<link rel="stylesheet" href="${file}" />`;
  }

  return `<script type="text/javascript" src="${file}" defer></script>`;
};

/**
 * @param {array} files to wrap with tag
 * @param {string} ignorePath to strip out
 * @return {string} conccat them all
 */
const tagJs = (files, ignorePath) => {
  return files.map(file => tagFile('js', file, ignorePath)).join('\r\n');
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
 *
 * @param {object} source from config
 * @param {string} key head or body
 * @return {array} always array even empty
 */
const extractFromSource = (source, key) => {
  if (source[key]) {
    let s = source[key];
    return Array.isArray(s) ? s : [s];
  }

  return [];
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
      let s = source[i];
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

  return { js, css };
};

/**
 * Combine function
 * @param {string} file to target
 * @param {string} ignorePath path to ignore and strip out
 * @return {string} tagged file
 */
function checkAndTagFile(file, ignorePath) {
  if (isJs(file)) {
    return tagFile('js', file, ignorePath);
  }

  if (isCss(file)) {
    return tagFile('css', file, ignorePath);
  }

  throw new Error('It must be js or css file!');
}

/**
 * New option in 1.0.10 pass the processor function
 * to run through the js before we pass to the tagging
 * @param {object} config configuration
 * @param {array} js the list of js files
 * @return {array} the list of js files
 */
function getProcessor(config, js) {
  const { processor } = config;
  if (processor && typeof processor === 'function') {
    let result = Reflect.apply(processor, null, [js]);
    if (!Array.isArray(result)) {
      throw new Error(`Expect your processor to return an array of javascript files!`);
    }

    return result;
  }

  return js;
}

/**
 * Prepare the css / js array to inject
 * @param {object} config the config.inject properties
 * @return {object} js<string> css<string>
 */
exports.getFilesToInject = function(config) {
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
      logutil(chalk.red(msg), config);
    }

    return { js: '', css: '' };
  }

  const br = '\r\n';

  return {
    js:
      getProcessor(config, js)
        .map(j => checkAndTagFile(j, config.ignorePath))
        .join(br) + br,
    css: css.map(c => checkAndTagFile(c, config.ignorePath)).join(br) + br
  };
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
exports.injectToHtml = (body, jsTags, cssTags, before = true) => {
  const html = _.isString(body) ? body : body.toString('utf8');
  const $ = cheerio.load(html);
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

  return $.html();
};

// Re-export for re-use
exports.tagJs = tagJs;
