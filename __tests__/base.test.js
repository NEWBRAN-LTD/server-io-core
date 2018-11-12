/**
 * Base test to see if the server start up without any options
 */
const test = require('ava');
// const request = require('superkoa');
const serverIoCore = require('./fixtures/server');

test.before(t => {
  const { app, stop } = serverIoCore();
  t.context.app = app;
  t.context.stop = stop;
});

test.after(t => {
  t.context.stop();
});

test('It should start with no config option', async (t) => {
  const res = await request(t.context.app).get('/');
  t.is(200, res.status);
});
