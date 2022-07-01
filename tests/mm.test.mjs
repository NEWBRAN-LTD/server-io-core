// Testing the v.2.3.0 new feature masterMind
import test from 'ava'
import { createConfiguration } from '../src/utils/config/index.mjs'

test('First test if the configuration can be correctly apply', t => {
  const config1 = createConfiguration({
    masterMind: 'some-different-end-point'
  })
  t.is(config1.masterMind.namespace, '/some-different-end-point')
  const config2 = createConfiguration({ masterMind: true })
  t.true(config2.masterMind.enable)
})
