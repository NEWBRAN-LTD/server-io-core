/**
 * Base test to see if the server start up without any options
 */
const test = require('ava')
const request = require('superkoa')
const serverIoCore = require('./fixtures/server')
const debug = require('debug')('server-io-core:test:base')
test.before(t => {
  const { app, stop } = serverIoCore({
    port: 8001
  });
  t.context.app = app;
  t.context.stop = stop;
})

test.after(t => {
  t.context.stop()
})

test('It should start with no config option', async (t) => {
  const res = await request(t.context.app).get('/')
  debug('result body', res.body)
  t.is(200, res.status)
})
