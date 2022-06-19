import test from 'ava'
import request from 'superkoa'
import serverSetup from './fixtures/server-setup.mjs'
import { getDebug } from '../src/utils/index.mjs'

const debug = getDebug('test:favicon')

test.before(async (t) => {
  const { app, stop } = await serverSetup({
    port: 8005
  })
  t.context.app = app
  t.context.stop = stop
})

test.after(t => {
  t.context.stop()
})
