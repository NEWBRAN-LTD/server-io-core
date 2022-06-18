// V.2 using ESM
// with a cjs build for other,let's give it a try
import { createConfiguration } from './utils/config/index.mjs'
import serverIoCoreInternal from './servers'
import createPublicProxy from './servers/proxy.mjs'
// Main
export default function serverIoCore (config = {}) {
  const options = createConfiguration(config)
  console.info('Hello world!', options)
  // first start our internal
  const {
    webserver,
    app,
    start,
    stop,
    io,
    port0,
    socketIsEnabled
  } = serverIoCoreInternal(config)
  
}
