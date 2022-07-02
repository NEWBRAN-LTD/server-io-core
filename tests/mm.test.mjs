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

test('Testing the main master mind feature', async t => {
  t.plan(3)
  return promise(async resolve => {
    const client = await masterMind()
    client.on('connect', () => {
      t.pass()
    })

    setTimeout(() => {
      client.emit('restart', (info) => {
        t.true(info.length > 0)

        client.emit('status', (status) => {
          t.true(status)

          setTimeout(() => {
            client.emit('stop')
            resolve()
          }, 100)
        })
      })
    }, 300)
  })
})
