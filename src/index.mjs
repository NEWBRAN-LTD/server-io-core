// V.2 using ESM
// with a cjs build for other,let's give it a try
import { createInternalServer } from './servers/internal-server.mjs'
import { createPublicProxyServer } from './servers/public-proxy-server.mjs'
import { openInBrowser } from './utils/open.mjs'
import { INTERNAL_PORT, MASTER_MIND, AUTO_START } from './lib/constants.mjs'
import { getDebug } from './utils/index.mjs'
import { startMsg } from './utils/start-msg.mjs'
const debug = getDebug('main')
// Main
export async function serverIoCore (config = {}) {
  // v2.3.0 we need to retain the old port number and pass here again
  let overwritePort = null
  // first start our internal
  const {
    webserver,
    app,
    io,
    startInternal,
    stopInternal,
    socketIsEnabled
  } = await createInternalServer(config)
  // first just store the stop call in here
  const allStop = [stopInternal]
  const configCb = config.callback
  // here we combine several start callstopInternal togethear
  const startAllFn = async () => {
    const port0 = await startInternal()
    debug(`Internal server started on ${port0}`)
    config[INTERNAL_PORT] = port0
    config.socketIsEnabled = socketIsEnabled
    if (config[MASTER_MIND].enable === true && overwritePort !== null) {
      config.port = overwritePort
    }
    const {
      startPublic,
      stopPublic
    } = await createPublicProxyServer(config)
    allStop.push(stopPublic)
    // this callback is from config
    if (typeof configCb === 'function') {
      Reflect.apply(configCb, null, [config])
    }
    const { port, address } = await startPublic()
    if (config[MASTER_MIND].enable === true) {
      overwritePort = port
    }
    debug('Public proxy server started on ', address, port)
    config.port = port // swap the port number because it could be a dynamic port now
    openInBrowser(config)
    startMsg(config)
    // create a table display
    return [port, port0, address]
  }
  // stop all
  const stopAllFn = () => {
    allStop.forEach((stop, i) => {
      debug('stop server', i)
      stop()
    })
  }
  // now we deal with the autoStart here
  if (config[AUTO_START] === true) {
    await startAllFn()
  }
  // return all the references
  return {
    config, // 2.3.0 return the config for master mind
    webserver,
    app,
    io,
    start: startAllFn,
    stop: stopAllFn
  }
}
