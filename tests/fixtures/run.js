const { join } = require('path');
const config = {
  webroot: [
    join(__dirname, 'demo', 'dist', 'base'),
    join(__dirname, 'demo', 'dist', 'assets')
  ],
  port: 8002,
  inject: {
    /*
    Source: [
      'css/bootstrap.min.css',
      'css/starter-template.css',
      'js/dummy-test.js'
    ]
    */
    processor: js => {
      console.info('inside the processor', js);
      return js;
    },
    target: {
      head: ['css/bootstrap.min.css', 'css/starter-template.css', 'js/dummy-test.js'],
      body: ['js/bootstrap.min.js', 'js/ie10-viewport-bug-workaround.js']
    }
  }
};
const server = require('./server');

server(config);
