#!/usr/bin/env node
// Cli interface in ESM
import { serve } from './src/lib/cli.mjs'
import { serverIoCore } from './src/index.mjs'
// Run
serve(serverIoCore)
