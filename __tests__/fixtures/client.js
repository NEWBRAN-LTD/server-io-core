// http client
// const http = require('http');
const debug = require('debug')('server-io-core:client');
const options = require('./options.json');
const fetch = require('node-fetch');


fetch('http://127.0.0.1:8999').then(res => {
  if (res.ok) {
    return res.text();
  }
  throw new Error('crap');
}).then(txt => console.log(txt));
