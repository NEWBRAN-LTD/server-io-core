// the combine startup server now is here
import Koa from 'koa'
// the 3 main servers
import { webserverGenerator } from './webserver.mjs'
import { staticServe } from './static-serve.mjs'
import { socketIoGenerator } from './socket-io-server.mjs'
// the others
import { debuggerServer } from '../middlewares/debugger/index.mjs'
import { reloadGenerator } from '../middlewares/reload/index.mjs'
// middlewares
import { registerMiddlewares } from '../middlewares/index.mjs'
import { getDebug } from '../utils/index.mjs'
const debug = getDebug('createInternalServer')
// main
export async function createInternalServer (config) {
  let io = null
  let socketIsEnabled = false
  const app = new Koa()
  const namespaceInUsed = []
  const unwatchFn = []
  const {
    webserver,
    startInternal,
    stopInternal
  } = webserverGenerator(app, config)
  // 2018-08-17 unless specify the socket will always be enable
  // 2019-05-01 if we need to proxy out the ws then this socket can not start
  // because we have to hijack it at the higher server.on.upgrade event
  if (
    config.socket.enable ||
    config.reload.enable ||
    (config.debugger.enable && config.debugger.server === true)
  ) {
    socketIsEnabled = true
    io = socketIoGenerator(webserver, config)
  }
  // @TODO we need to combine the two socket server into one
  // 1. check if those modules that require a socket server is needed
  // 2. generate a socket server, then passing the instance back to
  // their respective constructors
  // Run the watcher, return an unwatch function
  if (config.reload.enable) {
    // Limiting the config options
    unwatchFn.push(reloadGenerator(config.webroot, io, config.reload))
    namespaceInUsed.push(config.reload.namespace)
  }
  // Debugger server start
  if (config.debugger.enable && config.debugger.server === true) {
    unwatchFn.push(debuggerServer(config, io))
    namespaceInUsed.push(config.debugger.namespace)
  }
  // Enable the injectors here, if socket server is enable that means
  // The injector related function need to be activated
  registerMiddlewares(app, config)
  // @TODO should this return a promise so we know if it works or not?
  // Keep the init of the static serve until the last call
  staticServe(app, config)
  // Call back on close
  webserver.on('close', () => {
    debug('webserver on close and clean up')
    // MockServerInstance.close();
    if (io && io.server && io.server.close) {
      io.server.close()
    }
    unwatchFn.forEach(fn => fn())
  })
  // V.2 return a whole bunch of props for use later
  return { webserver, app, startInternal, stopInternal, io, socketIsEnabled }
}
