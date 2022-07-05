#!/usr/bin/env node
// cjs version of the cli
const { socketIoCore } = require('./index.js')
const { serve } = require('./cjs/lib/cli.mjs.js')
const { isFunction } = require('./cjs/utils/common.mjs.js')
import('meow')
  .then(meow => {
    if (meow && meow.default && isFunction(meow.default)) {
      return meow.default
    }
    throw new Error('Can not load meow!')
  }).then(meow => {
    serve(meow, socketIoCore)
  })
