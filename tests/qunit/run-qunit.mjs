
import runQunitSetup from './run-qunit-setup.mjs'
const config = {
  "port": 8081,
  "webroot": [
    "/home/joel/Projects/github/server-io-core/tests/qunit/webroot",
    "/home/joel/Projects/github/server-io-core/tests/qunit/files"
  ],
  "open": true,
  "reload": true,
  "testFilePattern": "*.qunit.js",
  "baseDir": "/home/joel/Projects/github/server-io-core/tests"
}

runQunitSetup(config)
  