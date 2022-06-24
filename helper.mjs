// export extra methods to help with other things
import { join, resolve } from 'node:path'
import glob from 'glob'

/** taken out from the searchFiles and run mutliple search */
const searchDir = (dest, baseDir) => new Promise((resolve) => {
  glob(dest, function (err, files) {
    if (err) {
      console.log('Some thing went wrong', err)
      // we don't want to reject it just let it run
      return resolve([])
      // return reject(err)
    }
    resolve(files.map(file => file.replace(baseDir, '')))
  })
})

/** just grab the middlewares if any */
const getMiddlewares = (config) => {
  const { middlewares } = config
  if (middlewares) {
    return Array.isArray(middlewares) ? middlewares : [middlewares]
  }
  return []
}

/** just a wrapper of glob to make it async */
export async function searchFiles (dests, baseDirs) {
  return Promise
    .all(dests.map((dest, i) => searchDir(dest, baseDirs[i])))
    .then(results => results.flatMap(a => a))
}

/**
 * @param {object} config configuration
 * @return {object} promise resolve the config for server-io-core
 */
export const getConfigForQunit = (config) => {
  const qunitDir = resolve(join(config.baseDir, 'qunit'))
  const baseDir = join(qunitDir, 'files')
  const webrootDir = join(qunitDir, 'webroot')

  return searchFiles([
    join(webrootDir, config.libFilePattern),
    join(baseDir, config.testFilePattern)
  ], [webrootDir, baseDir])
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
            body: files
          }
        }
      }
    ))
}
