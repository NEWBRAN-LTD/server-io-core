// Testing the v.2.3.0 new feature masterMind
import test from 'ava'
import { createConfiguration } from '../src/utils/config/index.mjs'

test('First test if the configuration can be correctly apply', t => {
  const config = createConfiguration({
    masterMind: 'some-different-end-point'
  })

  console.log(config)

  t.is(config.masterMind.namespace, '/some-different-end-point')
})
