// Quick middleware to serve up the bloody favicon
const { join, resolve } = require('path');
const fsx = require('fs-extra');
// Borrow from koa2-favicon
module.exports = function(config) {
  let filePath =
    config.favicon && fsx.existsSync(resolve(config.favicon))
      ? config.favicon
      : join(__dirname, 'favicon.ico');
  let icon;
  const maxAge =
    config.maxAge === null ? 86400000 : Math.min(Math.max(0, config.maxAge), 31556926000);
  const cacheControl = `public, max-age=${(maxAge / 1000) | 0}`;
  return async function(ctx, next) {
    if ((ctx.method === 'GET' || ctx.method === 'HEAD') && ctx.path === '/favicon.ico') {
      if (!icon) {
        icon = fsx.readFileSync(filePath);
      }

      ctx.status = 200;
      ctx.set('Cache-Control', cacheControl);
      ctx.type = 'image/x-icon';
      ctx.body = icon;
    }

    await next();
  };
};
