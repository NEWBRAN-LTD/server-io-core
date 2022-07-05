#!/usr/bin/env node
// Cli interface in ESM
import meow from 'meow'
import { serve } from './src/lib/cli.mjs'
import { serverIoCore } from './index.mjs'
// Run
serve(meow, serverIoCore)
