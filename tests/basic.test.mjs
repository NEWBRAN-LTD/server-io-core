// basic test with autoStart
import test from 'ava'
import request from 'superkoa'
import serverSetup from './fixtures/server-setup.mjs'
import { getDebug } from '../src/utils/index.mjs'

const debug = getDebug('test:basic')

test.before(async (t) => {
  const { app, stop } = await serverSetup({ port: 8001 })
  t.context.app = app
  t.context.stop = stop
})

test.after((t) => {
  t.context.stop()
})

test('It should start with minimum config option', async t => {
  const res = await request(t.context.app).get('/')
  debug('result body', res.body)
  t.is(res.status, 200)
})
