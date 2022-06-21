import test from 'ava'
import request from 'superkoa'
import fetch from 'node-fetch'
import serverSetup from './fixtures/server-setup.mjs'

const port = 8005
test.before(async (t) => {
  const { app, stop } = await serverSetup({
    port
  })
  t.context.app = app
  t.context.stop = stop
})

test.after(t => {
  t.context.stop()
})

test('It should serve up a stock favicon via the internal server', async t => {
  const res = await request(t.context.app).get('/favicon.ico')
  t.is(200, res.status)
})

test('We should able to access the same favicon via the public proxy @ ' + `http://localhost:${port}`, async t => {
  const res = await fetch(`http://localhost:${port}/favicon.ico`)
  t.is(200, res.status)
})
