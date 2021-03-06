import debugFn from 'debug'
import { DEBUG_MAIN_KEY } from '../lib/constants.mjs'

// main
export function getDebug (key) {
  return debugFn([DEBUG_MAIN_KEY, key].join(':'))
}
