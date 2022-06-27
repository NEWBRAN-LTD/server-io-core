#!/usr/bin/env node
// cjs version of the cli
const { serve } = require('./cjs/lib/cli.mjs')
const { socketIoCore } = require('./cjs/index.mjs')

serve(socketIoCore)
