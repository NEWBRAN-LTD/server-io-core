/**
 * This file will only get call from the main setup process as a fork process
 * And communicate back via the subprocess.send
 */
const stockWatcher = require('./stock-watcher');
let fn = null;
/**
 * This is when we received call from the parent process
 */
process.on('message', m => {
  switch (m.type) {
    case 'start':
      fn = stockWatcher(m.config, files => {
        process.send({ type: 'change', files: files });
      });
      break;
    case 'exit':
      fn();
      break;
    default:
      process.send({ type: 'error', err: 'Unknown event', event: m.type });
  }
});
