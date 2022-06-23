// export extra methods to help with other things
import { join, resolve } from 'node:path'
import glob from 'glob'
/** just a wrapper of glob to make it async */
async function searchFiles (dest) {
  return new Promise((resolve, reject) => {
    glob(dest, function (err, files) {
      if (err || !files.length) {
        return reject(err)
      }
      resolve(files)
    })
  })
}

// just grab the middlewares if any
const getMiddlewares = (config) => {
  const { middlewares } = config
  if (middlewares) {
    return Array.isArray(middlewares) ? middlewares : [middlewares]
  }
  return []
}

/**
 * @param {object} config configuration
 * @return {object} promise resolve the config for server-io-core
 */
export const getConfigForQunit = (config) => {
  const baseDir = resolve(join(config.baseDir, 'qunit', 'files'))
  return searchFiles(join(baseDir, config.testFilePattern))
    .then(files => (
      {
        qunit: true, // MUST SET TO TRUE
        port: config.port,
        webroot: config.webroot,
        open: config.open,
        reload: config.reload,
        middlewares: getMiddlewares(config),
        // DON"T TOUCH THIS UNLESS YOU KNOW WHAT YOU ARE DOING //
        inject: {
          insertBefore: false,
          target: {
            body: files.map(file => file.replace(baseDir, ''))
          }
        }
      }
    ))
}
