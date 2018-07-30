/**
 * Combine the two separate functions together into one koa-injector middleware
 */
const debug = require('debug')('server-io-core:inject');
const { headerParser } = require('../utils/helper');

module.exports = () => {
  return async (ctx, next) => {
    await next();

    debug('url', ctx.url);
    debug('originalUrl', ctx.url);
    debug('href', ctx.href);
    debug('path', ctx.path);

    // Debug('html', ctx.is('text/html'));
    debug('type', headerParser(ctx.request));
    // Debug('body', ctx.req);

    if (ctx.url === '/') {
      // Ctx.body = 'steal it!';
    }
  };
};
