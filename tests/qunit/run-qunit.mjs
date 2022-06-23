import { getConfigForQunit } from '../../helper.mjs'
import serverIoCore from '../../index.mjs'
// export it
async function runQunitSetup (userConfig) {
  return getConfigForQunit(userConfig)
    .then(serverIoCore)
    .catch(err => {
      console.error(err)
    })
}

const config = {
  port: 0,
  webroot: [
    '/home/joel/Projects/github/server-io-core/tests/qunit/webroot',
    '/home/joel/Projects/github/server-io-core/tests/qunit/files'
  ],
  open: true,
  reload: true,
  qunit: true,
  testFilePattern: '*.qunit.js',
  baseDir: '/home/joel/Projects/github/server-io-core/tests'
}

runQunitSetup(config)
