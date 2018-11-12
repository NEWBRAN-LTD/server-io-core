const test = require('ava');
const options = require('./fixtures/options.json');

test(`It should able to connect to another proxy on ${options.proxy.port}`)
