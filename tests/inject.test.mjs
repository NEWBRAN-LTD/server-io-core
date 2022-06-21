// testing the injector
import test from 'ava'
import request from 'superkoa'
import serverSetup from './fixtures/server-setup.mjs'
import { replaceContent } from '../src/middlewares/injector/files-inject.mjs'
import fsx from 'fs-extra'
import cheerio from 'cheerio'
import { join } from 'node:path'
import { getDirname } from '../src/utils/index.mjs'
// setup
const __dirname = getDirname(import.meta.url)
const replaceOptions = [
  {
    target: '<h1>This is a dummy page</h1>',
    str: '<h2>this is not a dummy page</h2>'
  }
]

test.before(async (t) => {
  const { app, stop } = await serverSetup({
    webroot: [
      join(__dirname, 'fixtures', 'demo', 'dist', 'base'),
      join(__dirname, 'fixtures', 'demo', 'dist', 'assets')
    ],
    port: 8002,
    inject: {
      insertBefore: false,
      target: {
        head: [
          // 'css/bootstrap.min.css',
          // 'css/starter-template.css'
        ],
        body: ['js/bootstrap.min.js', 'js/ie10-viewport-bug-workaround.js']
      },
      replace: replaceOptions
    }
  })
  t.context.app = app
  t.context.stop = stop
})

test.after(t => {
  t.context.stop()
})
// test start
test('Testing the replace function', async t => {
  const html = fsx.readFileSync(
    join(__dirname, 'fixtures', 'demo', 'dist', 'base', 'dummy.html')
  )
  const replaceOptions1 = [
    {
      target: '<h1>This is a dummy page</h1>',
      file: join(__dirname, 'fixtures', 'demo', 'text.txt')
    }
  ]
  const result = replaceContent(html.toString(), replaceOptions1)
  const $ = cheerio.load(result)
  const h2 = $('h3').toArray()

  t.truthy(h2.length)
})

test.serial('It should able to read html apart from index', async t => {
  const res = await request(t.context.app).get('/dummy.html')
  t.is(200, res.status)
})

test.serial('It should able to inject files according to the inject object', async t => {
  const res = await request(t.context.app).get('/dummy.html')
  // console.log('return body', res.text)
  const result = res.text

  t.truthy(result)

  const $ = cheerio.load(result)
  const h2 = $('h2').toArray()

  t.truthy(h2.length)
})
