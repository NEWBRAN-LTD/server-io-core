// Testing the rollup plugin
import { join } from 'node:path'
import commonjs from '@rollup/plugin-commonjs'
import node from '@rollup/plugin-node-resolve'
import buble from '@rollup/plugin-buble'
import { terser } from 'rollup-plugin-terser'
import scss from 'rollup-plugin-scss'
import css from 'rollup-plugin-import-css'
import { getDirname } from './src/utils/index.mjs'
const __dirname = getDirname(import.meta.url)
const buildDir = join(__dirname, 'dev', 'rollup', 'build')
// import progress from 'rollup-plugin-progress'
// import visualizer from 'rollup-plugin-visualizer'
// import uglify from 'rollup-plugin-uglify'
// const environmentMode = 'const process = { env: { NODE_ENV: \'development\' } }'
export default [{
  input: join(__dirname, 'dev', 'rollup', 'app', 'src', 'index.js'),
  output: [{
    // intro: environmentMode,
    exports: 'none',
    format: 'esm',
    file: join(buildDir, 'app.js'),
    sourcemap: true,
    plugins: [
      css({
        output: join(buildDir, 'app.css')
      }),
      scss({
        output: join(buildDir, 'app.scss.css')
      }),
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
      buble({
        jsx: 'h',
        exclude: 'node_modules/!**',
        transforms: { modules: false }
      }),
      terser()
    ],
    globals: ['fs', 'path', 'readline']
  }]
}]
