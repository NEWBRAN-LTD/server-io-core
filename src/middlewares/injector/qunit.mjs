// This is a special qunit helper to replace the external load qunit files to the local serve files
/*
https://code.jquery.com/qunit/
*/
import { join } from 'node:path'
import {
  readDocument
} from '../../utils/index.mjs'
import {
  CSS_CONTENT_TYPE
} from '../../lib/constants.mjs'
import {
  success,
  failed,
  debug
} from './helpers.mjs'
// setup
const projectRoot = process.cwd()
const dir = 'qunit'
const nodeModulesDir = join(projectRoot, 'node_modules', dir)
const js = 'qunit.js'
const css = 'qunit.css'
const qunitJs = [dir, js].join('/')
const qunitCss = [dir, css].join('/')

export function prepareQunit (config) {
  if (config.qunit !== false) {
    return targets
      .map(file => ({
        ['/' + file]: serveQunit
      }))
      .reduce((a, b) => Object.assign(a, b), {})
  }
  return {}
}

export const targets = [qunitJs, qunitCss]
// Main method
export async function serveQunit (ctx, config) {
  const found = targets.filter(url => ctx.url === '/' + url)
  if (found.length > 0) {
    try {
      const file = found[0].split('/')[1]
      const target = join(nodeModulesDir, dir, file)
      debug('qunit target', target)
      const doc = await readDocument(target)
      const contentType = target.indexOf('.css') > -1 ? CSS_CONTENT_TYPE : false
      success(ctx, doc, contentType)
      return true
    } catch (e) {
      failed(ctx, e, 'search for qunit file failed')
    }
  }
}
