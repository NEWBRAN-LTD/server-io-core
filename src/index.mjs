// V.2 using ESM
// with a cjs build for other,let's give it a try
import serverIoCoreInternal from './servers/index.mjs'
import createPublicProxy from './servers/proxy.mjs'
import { INTERNAL_PORT } from './lib/constants.mjs'
import { getDebug } from './utils/index.mjs'
const debug = getDebug('main')
// Main
export default async function serverIoCore (config = {}) {
  // first start our internal
  const {
    webserver,
    app,
    io,
    start,
    stop,
    socketIsEnabled
  } = await serverIoCoreInternal(config)
  // first just store the stop call in here
  const allStop = [stop]
  // here we combine several start call togethear
  const allStartFn = async () => {
    const port0 = await start()
    debug(`Internal server started on ${port0}`)
    config[INTERNAL_PORT] = port0
    config.socketIsEnabled = socketIsEnabled
    const obj = await createPublicProxy(config)
    allStop.push(obj.stop)
    return await obj.start()
  }
  const allStopFn = () => {
    allStop.forEach((stop, i) => {
      debug('stop server', i)
      stop()
    })
  }
  // now we deal with the autoStart here
  if (config.autoStart) {
    await allStartFn()
  }
  // return all the references
  return {
    webserver,
    app,
    io,
    start: allStartFn,
    stop: allStopFn
  }
}
