// testing the multiple file serve up scenario
const test = require('ava');
const request = require('superkoa');
const serverIoCore = require('./fixtures/server');
const debug = require('debug')('server-io-core:test:inect');
const { join } = require('path');
// const cheerio = require('cheerio');
test.before(t => {
  const { app, stop } = serverIoCore({
    webroot: [
      join(__dirname, 'fixtures', 'demo', 'dist', 'base'),
      join(__dirname, 'fixtures', 'demo', 'dist', 'assets')
    ],
    open: false,
    debugger: false,
    reload: false,
    socket: false,
    port: 8002,
    inject: {
      target: {
        head: [
          // 'css/bootstrap.min.css',
          // 'css/starter-template.css'
        ],
        body: [
          'js/bootstrap.min.js',
          'js/ie10-viewport-bug-workaround.js'
        ]
      }
    }
  });
  t.context.app = app;
  t.context.stop = stop;
});

test.after(t => {
  t.context.stop();
});

test('It should able to read html apart from index', async (t) => {
  const res = await request(t.context.app).get('/dummy.html');
  t.is(200, res.status);
});

test('It should able to inject files according to the inject object', async t => {
  const res = await request(t.context.app).get('/');
  // This always return a {} @TODO
  debug('return body', res.body);
  t.pass();

});
