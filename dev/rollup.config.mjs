// Testing the rollup plugin
import { join } from 'node:path'
import commonjs from '@rollup/plugin-commonjs'
import node from '@rollup/plugin-node-resolve'
import buble from '@rollup/plugin-buble'
import { terser } from 'rollup-plugin-terser'
// import scss from 'rollup-plugin-scss'
import css from 'rollup-plugin-import-css'
// import cssOnly from 'rollup-plugin-css-only'
// import badCSS from './plugins/rollup-plugin-bad-css.mjs'
import { getDirname } from '../src/utils/index.mjs'
const __dirname = getDirname(import.meta.url)
const appDir = join(__dirname, 'rollup')
const buildDir = join(appDir, 'build')
// import progress from 'rollup-plugin-progress'
// import visualizer from 'rollup-plugin-visualizer'
// import uglify from 'rollup-plugin-uglify'
// const environmentMode = 'const process = { env: { NODE_ENV: \'development\' } }'
export default [{
  input: join(appDir, 'app', 'src', 'index.js'),
  output: [{
    name: 'testApp',
    // exports: 'default',
    format: 'iife',
    file: join(buildDir, 'app.js'),
    sourcemap: true,
    plugins: [
      terser()
    ],
    globals: ['fs', 'path', 'readline']
  }],
  plugins: [
    node({
      jsnext: true,
      main: true,
      browser: true,
      module: true
    }),
    commonjs({
      include: ['node_modules/**'],
      ignoreGlobals: true,
      sourceMap: true
    }),
    css({
      output: join(buildDir, 'app.css')
    }),
    buble({
      jsx: 'h',
      exclude: 'node_modules/!**',
      transforms: { modules: false }
    })
  ]
}]
