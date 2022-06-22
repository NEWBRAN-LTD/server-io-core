// This is a special qunit helper to replace the external load qunit files to the local serve files
/*
https://code.jquery.com/qunit/
*/
import { join } from 'node:path'
import {
  readDocument
} from '../../utils/index.mjs'
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
const targets = [qunitJs, qunitCss]
// Main method
export async function serveQunit (ctx, config) {
  const found = targets.filter(url => ctx.url === '/' + url)
  if (found.length > 0) {
    try {
      const file = found[0].split('/')[1]
      const target = join(nodeModulesDir, dir, file)
      debug('qunit target', target)
      const doc = await readDocument(target)
      success(ctx, doc)
      return true
    } catch (e) {
      failed(ctx, e, 'search for qunit file failed')
    }
  }
}
