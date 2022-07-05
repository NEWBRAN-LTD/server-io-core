// set up a basic server
import { serverIoCore } from '../../index.mjs'
import { join } from 'node:path'
import { getDirname } from '../../src/utils/common.mjs'
const __dirname = getDirname(import.meta.url)

const defaultOptions = {
  socket: false,
  debugger: false,
  reload: false,
  open: false,
  webroot: join(__dirname, 'demo', 'dist', 'base')
}

export default async function (extra = {}) {
  return await serverIoCore(Object.assign(defaultOptions, extra))
}
