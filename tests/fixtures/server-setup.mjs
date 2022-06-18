// set up a basic server
import serverIoCore from '../../index.mjs'
import { join } from 'node:path'

const defaultOptions = {
  socket: false,
  debugger: false,
  reload: false,
  open: false,
  webroot: join(__dirname, 'demo', 'dist', 'base')
}

export default function (extra = {}) {
  return serverIoCore(Object.assign(defaultOptions, extra))
}
