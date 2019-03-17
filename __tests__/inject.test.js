// testing the multiple file serve up scenario
const test = require('ava');
const request = require('superkoa');
const serverIoCore = require('./fixtures/server');

test.before(t => {
  const { app, stop } = serverIoCore({
    port: 8002
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
