import test from 'ava'
import { formatStr } from '@jsonql/utils'
import { reloadTpl } from '../src/middlewares/reload/reload.tpl.mjs'

test('It should able to use the formatStr to insert path variable', t => {
  const value = ', path=\'custom-path\''
  const result = formatStr(reloadTpl, ', path=\'custom-path\'')

  t.true(result.indexOf(value) > -1)
})
