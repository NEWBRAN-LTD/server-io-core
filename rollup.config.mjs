// Building a cjs version for compatibility reason
import { join } from 'node:path'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import buble from '@rollup/plugin-buble'
import { getDirname } from './src/utils/index.mjs'
const __dirname = getDirname(import.meta.url)

const plugins = [
  commonjs(),
  nodeResolve({ preferBuiltins: true }),
  json()
]
const outplugins = [
  buble()
]

export default [
/*  { 2.4.2 no longer support CJS too much work for no reason
    external: /node_modules/,
    input: join(__dirname, 'src', 'index.mjs'), // V2.1.0 only build the src to cjs
    output: [{
      // intro,
      dir: 'cjs',
      // exports: 'default',
      preserveModules: true,
      format: 'cjs',
      sourcemap: false,
      plugins: outplugins
    }],
    plugins
  },
  {
    external: /node_modules/,
    input: join(__dirname, 'src', 'lib', 'cli.mjs'),
    output: [{
      format: 'cjs',
      file: join(__dirname, 'cjs', 'lib', 'cli.mjs.js'),
      sourcemap: false,
      plugins: outplugins
    }],
    plugins
  },  */
  {
    external: /node_modules/,
    input: join(__dirname, 'helper.mjs'),
    output: [{
      format: 'cjs',
      file: join(__dirname, 'helper.js'),
      sourcemap: false,
      plugins: outplugins
    }],
    plugins
  },
  {
    external: /node_modules/,
    input: join(__dirname, 'mastermind.mjs'),
    output: [{
      format: 'cjs',
      file: join(__dirname, 'mastermind.js'),
      sourcemap: false,
      plugins: outplugins
    }],
    plugins
  }
]
