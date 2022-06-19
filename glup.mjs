// The gulp interface in ESM
import through from 'through2'
import { getDebug } from './src/utils/common.mjs'

const debug = getDebug('gulp')
// @TODO this is not complete
export default function serverIoCoreGulp (options = {}) {
  debug('gulp options', options)
  const filePaths = []
  const stream = through
    .obj((file, enc, callback) => {
      // Serve up the files
      // app.use(config.path, serveStatic(file.path, config));
      filePaths.push(file.path)
      callback()
      debug('[main][add file]', filePaths)
    })
    .on('data', f => {
      filePaths.push(f.path)
      debug('[main][data add file]', filePaths)
    })
    .on('end', () => {
      debug('[main][on end]', filePaths)
    })
  stream.on('kill', () => {
    // Call the stop method here
    debug('kill called')
  })

  // Return
  return stream
}
