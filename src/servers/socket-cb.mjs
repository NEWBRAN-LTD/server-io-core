// V1.0.2
// We create a custom namespace that allow a third party module to call it
// then pass a callback to handle this calls
// also pass this to the callback for the developer to use
import socketIoClient from 'socket.io-client'
// main
export default function socketCb (io, namespace) {
  const ctn = namespace.length
  for (let i = 0; i < ctn; ++i) {
    const { path, callback } = namespace[i]
    if (
      path && typeof path === 'string' &&
      callback && typeof callback === 'function'
    ) {
      const nsp = io.of(path)
      callback(nsp, io, socketIoClient)
    }
  }
}
