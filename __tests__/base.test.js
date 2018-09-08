/**
 * Base test to see if the server start up without any options
 */
const test = require('ava');
const request = require('superkoa');
const serverIoCore = require('../index');
const { join } = require('path');

test.before(t => {
  const { app, stop } = serverIoCore({
    // autoStart: false,
    debugger: false,
    reload: false,
    webroot: join(__dirname, 'fixtures', 'demo', 'dist', 'base')
  });
  t.context.app = app;
  t.context.stop = stop;
});

test.after(t => {
  t.context.stop();
  // process.exit();
});

test('It should start with no config option', async (t) => {
  // t.plan(1);
  const res = await request(t.context.app).get('/');
  t.is(200, res.status);
  // t.pass();
});
