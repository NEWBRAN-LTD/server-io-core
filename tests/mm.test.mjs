// Testing the v.2.3.0 new feature masterMind
import test from 'ava'
import { createConfiguration } from '../src/utils/config/index.mjs'
import { masterMind } from '../mastermind.mjs'
import { promise } from '@jsonql/utils'

test('First test if the configuration can be correctly apply', t => {
  const config1 = createConfiguration({
    masterMind: 'some-different-end-point'
  })
  t.is(config1.masterMind.namespace, '/some-different-end-point')
  const config2 = createConfiguration({ masterMind: true })
  t.true(config2.masterMind.enable)
})

test.skip('Testing the main master mind feature', async t => {
  t.plan(2)
  return promise(resolve => {
    const client = masterMind()
    client.emit('start', null, (info) => {
      console.log(info)
      t.pass()
    })
    setTimeout(() => {
      client.emit('restart', null, (info) => {
        console.log(info)
        t.pass()
      })
      setTimeout(() => {
        client.emit('stop')
        resolve()
      }, 300)
    }, 300)
  })
})
