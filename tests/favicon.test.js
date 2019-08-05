const test = require('ava');
const request = require('superkoa');
const serverIoCore = require('./fixtures/server');
const debug = require('debug')('server-io-core:test:base');
test.before(t => {
  const { app, stop } = serverIoCore({
    port: 8005,
    open: false
  });
  t.context.app = app;
  t.context.stop = stop;
});

test.after(t => {
  t.context.stop();
});

test('It should serve up a stock favicon', async t => {
  const res = await request(t.context.app).get('/favicon.ico');

  t.is(200, res.status);
});
