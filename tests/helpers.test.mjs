import test from 'ava'
import { searchFiles } from '../helper.mjs'
import { join } from 'node:path'
import { getDirname } from '../src/utils/index.mjs'
const __dirname = getDirname(import.meta.url)

test('should able to search directories and find the files', async t => {
  const baseDir = join(__dirname, 'qunit')
  const config = [
    join(baseDir, 'webroot', 'lib', '*.lib.js'),
    join(baseDir, 'files', '*.qunit.js')
  ]
  const results = await searchFiles(config, [join(baseDir, 'webroot'), join(baseDir, 'files')])
  // console.log(results)
  t.true(results.length > 0)
})
