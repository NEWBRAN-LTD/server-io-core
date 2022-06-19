import test from 'ava'
import request from 'superkoa'
import serverSetup from './fixtures/server-setup.mjs'

test.before(async (t) => {
  const { app, stop } = await serverSetup({
    port: 8005
  })
  t.context.app = app
  t.context.stop = stop
})

test.after(t => {
  t.context.stop()
})

test('It should serve up a stock favicon', async t => {
  const res = await request(t.context.app).get('/favicon.ico')
  t.is(200, res.status)
})
