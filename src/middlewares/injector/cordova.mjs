// move out from the render-scripts-middleware
import { join } from 'node:path'
import {
  getDirname,
  readDocument,
  isString
} from '../../utils/index.mjs'
import {
  success,
  failed
} from './helpers.mjs'
import {
  cordovaJs
} from '../../lib/constants.mjs'
const __dirname = getDirname(import.meta.url)
// if this is enable then return the mapped object
export function prepareCordova (config) {
  if (config.cordova !== false) {
    const cordovaTargets = targets
      .map(file => ({ ['/' + file]: serveCordova }))
      .reduce((a, b) => Object.assign(a, b), {})
    return cordovaTargets
  }
  return {}
}

export const targets = [cordovaJs]
// main method
export async function serveCordova (ctx, config) {
  if (ctx.url === '/' + cordovaJs) {
    if (config.cordova === true) {
      const doc = await readDocument(join(__dirname, 'cordova.js.tpl'))
      success(ctx, doc)
      return true
    }
    if (isString(config.cordova)) {
      try {
        success(ctx, await readDocument(config.cordova))
        return true
      } catch (e) {
        failed(ctx, e, config.cordova + ' Not found!')
      }
    }
  }
}
