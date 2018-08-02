/**
 * Base test to see if the server start up without any options
 */
const test = require('ava');
const request = require('superkoa');
const serverIoCore = require('../index');
const { join } = require('path');

test.before((t) => {
  const w = serverIoCore({
    webroot: join(__dirname, 'fixtures', 'demo', 'dist', 'base')
  });
  t.context.app = w.webserver;
  t.context.fn = w.stop;
});

/*
test.after(() => {
  fn();
  app = undefined;
});
*/

test('It should start with no config option', async (t) => {
  const res = await request(t.context.app).get('/');
  t.is(200, res.status);
});
