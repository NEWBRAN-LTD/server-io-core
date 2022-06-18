// Utils
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import _isString from 'lodash-es/isString'
import log from 'fancy-log'
import { defaultHostIp } from '../lib/constants'

const IS_TEST = process.env.NODE_ENV === 'test'

/**
 * create a promisify version of read file also check before read
 */
export const readAsync = file => {
  if (fs.existsSync(file)) {
    return promisify(fs.readFile)(file, { encoding: 'utf8' })
  }
  return Promise.reject(new Error(file + ' not found!'))
}

/**
 * @return {string} ip address
 */
export const getLocalIp = () => (
  Object.values(os.networkInterfaces()).filter(net => {
    return net[0].address !== '127.0.0.1'
  }).reduce((last, next) => {
    return next[0].address
  }, '')
)

/**
 * @return {boolean} windoze or not
 */
export const isWindoze = () => (os.platform().indexOf('win') === 0)

/**
 * If's it's windows then need to get the ip address of the network interface
 * otherwise we just need to use 0.0.0.0 to bind to all
 * @return {string} ip address
 */
export const getServingIpforOS = () => {
  const ip = getLocalIp()
  if (isWindoze()) {
    return [ip, ip]
  }
  return [defaultHostIp, ip]
}

// Const debug = process.env.DEBUG;
// Main
export const logutil = function (...args) {
  if (!IS_TEST) {
    Reflect.apply(log, null, args)
  }
}

/**
 * create a random number between two values, for creating a random port number
 * @param {int} min
 * @param {int} max
 * @return {int} port
 */
export const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Make sure the supply argument is an array
 */
export const toArray = param => {
  if (param) {
    return Array.isArray(param) ? param : [param]
  }
  return []
}

/**
 * @param {mixed} opt
 * @return {boolean} result
 */
export const isString = opt => {
  return _isString(opt)
}

/**
 * Set headers @TODO there is bug here that cause the server not running correctly
 * @param {object} config
 * @param {string} urlToOpen
 * @return {function} middleware
 */
export const setHeaders = (config, urlToOpen) => {
  return res => {
    if (isString(config.headers.origin) || (urlToOpen && urlToOpen.indexOf('http') === 0)) {
      res.setHeader(
        'Access-Control-Allow-Origin',
        isString(config.headers.origin) || (isString(urlToOpen) || '*')
      )
    }
    res.setHeader(
      'Access-Control-Request-Method',
      isString(config.headers.requestMethod) || '*'
    )
    res.setHeader(
      'Access-Control-Allow-Methods',
      isString(config.headers.allowMethods) || 'GET , POST , PUT , DELETE , OPTIONS'
    )
    res.setHeader(
      'Access-Control-Allow-Headers',
      isString(config.headers.allowHeaders) || 'Content-Type, Authorization, Content-Length, X-Requested-With'
    )
  }
}

/**
 * For use in debugger / reload client file generator
 */
export const getSocketConnectionConfig = config => {
  let connectionOptions =
    ", {'force new connection': false , 'transports': ['websocket']}"
  if (typeof config.server === 'object') {
    if (
      config.server.clientConnectionOptions &&
      typeof config.server.clientConnectionOptions === 'object'
    ) {
      connectionOptions =
        ', ' + JSON.stringify(config.server.clientConnectionOptions)
    }
  }
  return connectionOptions
}

/**
 * Make sure to pass directories to this method
 * @20180322 Add if this is not a directory then we resolve the file path directory
 * @param {array} filePaths array of directories
 * @return {array} fixed paths
 */
export const ensureIsDir = filePaths => {
  const paths = toArray(filePaths)
  return _.compact(
    paths.map(d => {
      return fs.existsSync(d)
        ? fs.lstatSync(d).isDirectory()
          ? d
          : path.dirname(d)
        : false
    })
  )
}

/**
 * The koa ctx object is not returning what it said on the documentation
 * So I need to write a custom parser to check the request content-type
 * @param {object} req the ctx.request
 * @param {string} type (optional) to check against
 * @return {mixed} Array or Boolean
 */
export const headerParser = (req, type) => {
  try {
    const headers = req.headers.accept.split(',')
    if (type) {
      return headers.filter(h => {
        return h === type
      })
    }
    return headers
  } catch (e) {
    // When Chrome dev tool activate the headers become empty
    return []
  }
}

/**
 * get document (string) byte length for use in header
 * @param {string} doc to calculate
 * @return {number} length
 */
export const getDocLen = doc => {
  return Buffer.byteLength(doc, 'utf8')
}

/**
 * turn callback to promise
 * @param {string} p path to file
 * @return {object} promise to resolve
 */
export const readDocument = p => new Promise((resolve, reject) => {
  fs.readFile(p, { encoding: 'utf8' }, (err, data) => {
    if (err) {
      return reject(err)
    }
    resolve(data)
  })
})


/**
 * @param {array} files to search
 * @return false on not found
 */
export const searchFileFromFiles = files => files
  .filter(fs.existsSync)
  .reduce((last, next) => {
    return next
  }, null)

/**
 * Search for the default index file
 * @param {object} config the serveStatic options
 * @return {string} path to the index file
 */
export const searchIndexFile = config => {
  const { webroot, index } = config
  const webroots = toArray(webroot)
  return webroots
    .map(d => [d, index].join('/'))
    .filter(fs.existsSync)
    .reduce((last, next) => {
      return next
    }, null)
}

/**
 * Double check if its a HTML file
 * @param {string} file path
 * @return {boolean} or not
 */
export const isHtmlFile = file => {
  const ext = path.extname(file).toLowerCase()
  return ext === '.html' || ext === '.htm'
}

/**
 * strip the root slash for the proxy context
 * @param {string} str input
 * @return {string} output without first slash
 */
export const stripFirstSlash = str => {
  const first = str.substring(0, 1)
  if (first === '/') {
    return str.substring(1)
  }
  return str
}

/**
 * make sure there is a slash before the namespace
 * @param {string} str input
 * @return {string} output with slash at the beginning
 */
export const ensureFirstSlash = str => '/' + stripFirstSlash(str)

/**
 * @param {any} value to compare
 * @param {array} arr for compare
 * @return {boolean} true found
 */
export const inArray = (value, arr) => arr.includes(value)
