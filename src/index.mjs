// V.2 using ESM
// with a cjs build for other,let's give it a try
import { createConfiguration } from './utils/config/index.mjs'

// Main
export default function serverIoCore (config = {}) {
  const options = createConfiguration(config)
  console.info('Hello world!', options)
}
