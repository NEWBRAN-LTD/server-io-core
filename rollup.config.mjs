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

export default [{
  external: /node_modules/,
  input: join(__dirname, 'index.mjs'),
  output: [{
    exports: 'default',
    format: 'cjs',
    file: join(__dirname, 'index.js'),
    sourcemap: true,
    plugins: outplugins
  }],
  plugins
}, {
  external: /node_modules/,
  input: join(__dirname, 'cli.mjs'),
  output: [{
    format: 'cjs',
    file: join(__dirname, 'cli.js'),
    sourcemap: false,
    plugins: outplugins
  }],
  plugins
}]
