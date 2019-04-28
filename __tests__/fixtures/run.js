const { join } = require('path');
const config = {
    webroot: [
    join(__dirname, 'demo', 'dist', 'base'),
    join(__dirname, 'demo', 'dist', 'assets')
  ],
  open: true,
  debugger: false,
  reload: false,
  socket: false,
  port: 8002,
  inject: {
    target: {
      head: [
        'css/bootstrap.min.css',
        'css/starter-template.css',
        'js/dummy-test.js'
      ],
      body: [
        'js/bootstrap.min.js',
        'js/ie10-viewport-bug-workaround.js'
      ]
    } 
  }
};
const server = require('./server');

server(config);