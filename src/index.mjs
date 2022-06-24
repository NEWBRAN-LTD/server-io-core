// V.2 using ESM
// with a cjs build for other,let's give it a try
import { createInternalServer } from './servers/internal-server.mjs'
import { createPublicProxyServer } from './servers/public-proxy-server.mjs'
import { openInBrowser } from './utils/open.mjs'
import { INTERNAL_PORT } from './lib/constants.mjs'
import { getDebug } from './utils/index.mjs'
import { startMsg } from './utils/start-msg.mjs'
const debug = getDebug('main')
// Main
export async function serverIoCore (config = {}) {
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
  if (config.autoStart) {
    await startAllFn()
  }
  /*
  V.2.2.0 feature restart the server
  retain the previous config stop --> start
  using the previous public port but not re-open the browser
  instead we need to add feature to the browser loaded code to
  be able to know the server is restarting
  const restart = () => {
    console.log('@TODO V2.2.0')
  }
  */
  // return all the references
  return {
    webserver,
    app,
    io,
    start: startAllFn,
    stop: stopAllFn
  }
}
