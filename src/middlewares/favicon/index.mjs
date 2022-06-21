// Favicon middleware
import { join, resolve } from 'node:path'
import fsx from 'fs-extra'
import { MAX_AGE, MAX_MAX_AGE } from '../../lib/constants.mjs'
import { getDirname } from '../../utils/index.mjs'
// Main - now its all name export
export default function faviconMiddlewareGenerator (config) {
  let icon
  const __dirname = getDirname(import.meta.url)
  const filePath = config.favicon && fsx.existsSync(resolve(config.favicon))
    ? config.favicon
    : join(__dirname, 'favicon.ico')
  const maxAge = config.maxAge === null
    ? MAX_AGE
    : Math.min(Math.max(0, config.maxAge), MAX_MAX_AGE)
  const cacheControl = `public, max-age=${(maxAge / 1000) | 0}`

  return async function faviconMiddleware (ctx, next) {
    if ((ctx.method === 'GET' || ctx.method === 'HEAD') && ctx.path === '/favicon.ico') {
      if (!icon) {
        icon = fsx.readFileSync(filePath)
      }
      ctx.status = 200
      ctx.set('Cache-Control', cacheControl)
      ctx.type = 'image/x-icon'
      ctx.body = icon
    }
    await next()
  }
}
