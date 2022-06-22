// export extra methods to help with other things
import glob from 'glob'
/** just a wrapper of glob to make it async */
export async function searchFiles (dest) {
  return new Promise((resolve, reject) => {
    glob(dest, function (err, files) {
      if (err || !files.length) {
        return reject(err)
      }
      resolve(files)
    })
  })
}
