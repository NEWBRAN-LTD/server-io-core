// this will grab the list of test files
// inject into the html and run the server
import { join, resolve } from 'node:path'
import glob from 'glob'
import serverIoCore from '../../index.mjs'

/**
 * @param {object} config configuration
 * @return {object} promise resolve the config for server-io-core
 */
const getConfig = (config) => {
  const baseDir = resolve(join(config.baseDir, 'qunit', 'files'))
  return new Promise((resolve, reject) => {
    glob(join(baseDir, config.testFilePattern), function (err, files) {
      if (err || !files.length) {
        console.error('FAILED TO FETCH ANY TEST FILES!')
        return reject(err)
      }
      // now start the server
      const opts = {
        port: config.port,
        webroot: config.webroot,
        open: config.open,
        reload: config.reload,
        middlewares: [], // you can add your koa 2 middleware as well
        // DON"T TOUCH THIS UNLESS YOU KNOW WHAT YOU ARE DOING //
        inject: {
          insertBefore: false,
          target: {
            body: files.map(file => file.replace(baseDir, ''))
          }
        }
      }
      resolve(opts)
    })
  })
}
// export it
export default async function runQunit (userConfig) {
  return getConfig(userConfig)
    .then(serverIoCore)
    .catch(err => {
      console.error(err)
    })
}
