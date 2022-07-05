#!/usr/bin/env node
// cjs version of the cli
const { socketIoCore } = require('./cjs/index.mjs.js')
import('./cjs/lib/cli.mjs.js')
  .then(serve => {
    serve(socketIoCore)
  })
