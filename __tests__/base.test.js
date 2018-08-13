/**
 * Base test to see if the server start up without any options
 */
const test = require('ava');
const request = require('superkoa');
const serverIoCore = require('../index');
const { join } = require('path');

test.beforeEach(t => {
  const w = serverIoCore({
    webroot: join(__dirname, 'fixtures', 'demo', 'dist', 'base')
  });
  t.context.app = w.app;
  t.context.stop = w.stop;
});

test.afterEach(t => {
  t.context.stop();
});

test('It should start with no config option', async (t) => {
  t.plan(1);
  const res = await request(t.context.app).get('/');
  t.is(200, res.status);
});
