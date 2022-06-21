// There is a problem with the options not pass correctly
import test from 'ava'
import { createConfiguration } from '../src/utils/config/index.mjs'

test('It should able to use just one props to overwrite the default props', t => {
  const config = {
    open: false
  }
  const options = createConfiguration(config)

  t.is(options.open.enable, false)
})
