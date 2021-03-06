/**
 * The generated server code are identical on both side anyway
 */
import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import { logutil } from '../utils/index.mjs'
import { DEFAULT_PORT } from '../lib/constants.mjs'
// According to https://github.com/visionmedia/supertest/issues/111
// Put this here to make sure it works everywhere
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
/**
 * @param {object} app the connect app
 * @param {object} config options
 * @return {object} http(s) webserver, (fn) start, (fn) stop
 */
export function webserverGenerator (app, config) {
  let webserver
  if (config.https.enable) {
    let opts
    let msg = ''
    if (config.https.key && config.https.cert) {
      if (fs.existsSync(config.https.key) && fs.existsSync(config.https.cert)) {
        opts = {
          key: fs.readFileSync(config.https.key),
          cert: fs.readFileSync(config.https.cert)
        }
      } else {
        msg = 'The key or cert you provide via the https configuration can not be found!'
        logutil('[https Error]', msg)
        throw new Error(msg)
      }
    } else if (config.https.pfx && config.https.passphrase) {
      if (fs.existsSync(config.https.pfx)) {
        opts = {
          pfx: fs.readFileSync(config.https.pfx),
          passphrase: config.https.passphrase
        }
      } else {
        msg = 'The pfx you prvide via the https configuration can not be found!'
        logutil('[https Error]', msg)
        throw new Error(msg)
      }
    } else {
      // Need to check if the user provide file exist or not!
      opts = {
        key: fs.readFileSync(config.https.devKeyPem),
        cert: fs.readFileSync(config.https.devCrtPem)
      }
    }
    // @2018-07-30 change to Koa style
    webserver = https.createServer(opts, app.callback())
  } else {
    // See last comment
    webserver = http.createServer(app.callback())
  }
  // @2018-08-20 add a new double ip options for serving and display
  // @2022-06-18 this moved to the main proxy
  // const hostname = Array.isArray(config.host) ? config.host[0] : config.host
  // Return it
  return {
    webserver,
    startInternal: async () => {
      return new Promise(resolve => {
        // @TODO this will be using a port:0 which means we are going to get a random port
        // and we return this for the main proxy to use
        webserver.listen(
          config.port0 || DEFAULT_PORT, // we could pick a port for test purpose
          // DEFAULT_HOST,
          () => {
            resolve(webserver.address().port)
            // the callback now move to the public server
          }
        )
      })
    },
    stopInternal: () => {
      webserver.close()
    }
  }
}
