// basic test with autoStart
import test from 'ava'
import request from 'superkoa'
import fetch from 'node-fetch'
import serverSetup from './fixtures/server-setup.mjs'
// import { getDebug } from '../src/utils/index.mjs'
// const debug = getDebug('test:basic')
const port = 7990

test.before(async (t) => {
  const { app, stop } = await serverSetup({ port })
  t.context.app = app
  t.context.stop = stop
})

test.after((t) => {
  t.context.stop()
})

test('It should start with minimum config option', async t => {
  const res = await request(t.context.app).get('/')
  // debug('result body', res.body)
  t.is(res.status, 200)
  // try again to use just fetch
  // const res1 = await fetch(`http://localhost:${}`)
})

test('We should able to access / via the public proxy ' + `http://localhost:${port}`, async t => {
  const res = await fetch(`http://localhost:${port}`)
  t.is(200, res.status)
})
