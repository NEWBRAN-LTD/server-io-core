const debug = require('debug')('server-io-core:test-proxy');
const serverIoCore = require('../../index');
const {
  // frontServer,
  standaloneServer,
  frontPort,
  proxyConfig,
  namespace
} = require('./socket');


const proxyPort = proxyConfig.target.port;

const { stop } = serverIoCore({
  open: false,
  reload: false,
  wsProxy: {
    enable: true,
    target: {
      namespace: namespace,
      host: ['http://localhost', proxyPort].join(':'),
      events: ['msg', 'reply']
    }
  },
  port: frontPort
});
// t.context.stop = stop;
