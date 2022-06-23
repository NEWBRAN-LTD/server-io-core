// Favicon middleware
import { resolve } from 'node:path'
import fsx from 'fs-extra'
import { MAX_AGE, MAX_MAX_AGE } from '../../lib/constants.mjs'
// convert our stock icon to base64 string
const base64icon = 'AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAABENi//PDAr/zAlIf9JQkL/ZGFi/3BsbP+gpKf/nqew/3l/j/9QT2//b3KQ/42Sof+cnJ7/8/Pz//7+/v/R0tL/Rjcw/zotKf8tIx//OjIx/35+f/+DhIX/hYmO/32Ai/9RUXD/cniS/6Krtv+gpqv/s7Oz///////p6er/0dLR/0EyK/84Kyb/LiMh/3h2dv+jqK3/maKs/6SqsP+ipq7/jZKe/3+HkP9/h5X/i5Oe/62wsf/k5ub/zs7O/7CwsP9ENi//NCYh/2RfX/+foqX/pKqw/5Scp/+ut73/rLnD/5mksv+BiZf/XmNw/2xzf/94fYX/kJOW/3JvdP+pqav/WVBL/zwwLP+UlJb/q7C1/5qiq/90fYv/bXaF/4ONnP9pcI3/laa3/4aTov9dYm3/VFVd/1lYXv9kYGv/8fLy/11XVP9TTUr/lJie/9LZ3v+iq7X/P0VU/3R/kP+IlaT/YWyD/3qKm/+Fl6n/bHWC/2RnbP9KRlP/s7S5//////9YT0n/b257/6+1xf/K0tj/x9DX/4GNnP+Dk6X/hJao/2Bte/9mc4T/bnyO/2pxfP9XWWL/ZmZx//f7+v//////Ylla/6Orwf+zvcz/kpuo/5mksf+DjZr/UVdh/2p5i/9canr/bn2O/11lcv9udYH/U1Zl/7/Hy////////f39/15UU/+JipH/YF9l/zcyNP9HRkf/WFtf/2Foc/96ipv/gZOk/11ldP9kbHn/cYCP/4SMmf/5/Pz///////3+/v9DNjD/PTAs/zQqJv8sJSX/LSw3/zEwOf9cX2X/lqa3/3GBk/9ugZH/dI2f/4GVpf/X4eX///////3+/v/0+vr/OSkk/zQnI/8/Oj//VVx5/11nlf9KUID/P0Zk/3V9iP+Op7z/gZ+x/3mUpv+itL//9/39///////y+fr/6/X2/1RJRv+KiZD/hZCv/3B2nv9ra5r/UU+C/1Raiv9zhJ7/jam5/4unt/+KobD/wtHZ///////2+fr/6PL0/+v09f/s9vj/6e/7/3N6nv9XVnT/YF+E/1FPdv9FRWr/Z3OZ/6K5yP+as8L/l6+9/+Dr8P/9////5O/y/+bw8v/q9PT/7/b4/+Hk8v9nbJH/bHGW/2Rok/9QUHr/VVmD/19olP++ytf/z93k/8HS3P/u9vj/5u/y/9/r7v/k7vD/5vDw/+rt+f/b3u3/ZmuT/15bhf91dJv/YF6G/1JRff9fZ5H/vMnX/9nl6v/f6/H/5O/y/9rm6v/d6ev/3+ns/+Tu7//t7/z/vMDT/1RVef9cWHf/mJzC/2lqlP9JRmT/WV16/7C8xv/c6e7/1+Pq/9nl6v/a5en/2uXo/93o7P/I3u3/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='

// Main - now its all name export
export function faviconMiddlewareGenerator (config) {
  const icon = config.favicon && fsx.existsSync(resolve(config.favicon))
    ? fsx.readFileSync(config.favicon)
    : Buffer.from(base64icon, 'base64')
  const maxAge = config.maxAge === null
    ? MAX_AGE
    : Math.min(Math.max(0, config.maxAge), MAX_MAX_AGE)
  const cacheControl = `public, max-age=${(maxAge / 1000) | 0}`

  return async function faviconMiddleware (ctx, next) {
    if (ctx.method === 'GET' && ctx.path === '/favicon.ico') {
      // @TODO should search if the document root has a favicon.ico first
      ctx.status = 200
      ctx.set('Cache-Control', cacheControl)
      ctx.type = 'image/x-icon'
      ctx.body = icon
    }
    await next()
  }
}
