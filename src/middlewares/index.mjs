/**
 * this register all the required middlewares
 */
import bodyParser from 'koa-bodyparser'
import { scriptsInjectorMiddleware, renderScriptsMiddleware } from './injector'
import faviconMiddleware from './favicon'
// main
export default function registerMiddlewares (app, config) {
  let addDebugger = false
  const addReload = config.reload.enable
  let middlewares = [bodyParser()]
  if (config.favicon !== false) {
    middlewares.push(faviconMiddleware(config))
  }
  // Make sure the namespace is correct first
  if (config.debugger.enable) {
    const namespace = config.debugger.namespace
    if (!namespace) {
      config.debugger.namespace = '/debugger-io'
    } else if (namespace.substr(0, 1) !== '/') {
      config.debugger.namespace = '/' + namespace
    }
    addDebugger = config.debugger.client !== false
  }
  // Live reload and inject debugger
  // This part inject the scripts into the html files
  if (addReload || addDebugger) {
    middlewares.push(renderScriptsMiddleware(config))
  }
  // @BUG the injector interfere with the normal operation
  if (addReload || addDebugger || config.inject.enable) {
    middlewares.push(scriptsInjectorMiddleware(config))
  }
  // Extra middlewares pass directly from config
  if (Array.isArray(config.middlewares)) {
    middlewares = middlewares.concat(config.middlewares)
  } else {
    middlewares.push(config.middlewares)
  }
  // Now inject the middlewares
  if (middlewares.length) {
    // But the problem with Koa is the ctx.state is not falling through
    // all the way, so we might need to add the middleware in stack
    // with app.use.apply(app, [middlewares_sub_array]);
    middlewares.forEach(m => app.use(m))
  }
  // should return what?
  return {}
}
