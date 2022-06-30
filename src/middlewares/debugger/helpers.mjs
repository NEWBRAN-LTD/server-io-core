/**
 * Take out a bunch of functions from the original debugger setup
 */
import util from 'node:util'
import { logutil, isString, isObject } from '../../utils/common.mjs'

const keys = ['browser', 'location']
const lb = '-'.repeat(90)

// Ditch the npm:table
export const table = rows => {
  if (Array.isArray(rows)) {
    rows.forEach(row => logutil(row))
  } else {
    logutil(rows)
  }
}

export const parseObj = data => {
  try {
    return JSON.parse(data)
  } catch (e) {
    return data
  }
}

// Encap to one func
export const displayError = e => {
  // This is required so we just do a simple test here
  // logutil('check typeof ' + data.toString());
  const rows = []
  if (e.from) {
    rows.push(`FROM: ${e.from}`)
  }
  keys.forEach((key) => {
    if (e[key]) {
      rows.push([key + ':', e[key]].join(' '))
    }
  })
  const _msg = parseObj(e.msg)
  if (isString(_msg)) {
    rows.push(['MESSAGE:', e.msg].join(' '))
  } else {
    let toShow
    const msgToArr = isString(_msg) ? parseObj(_msg) : _msg
    if (Array.isArray(msgToArr)) {
      rows.push('MESSAGE(S):')
      msgToArr.forEach(a => {
        if (typeof a === 'object') {
          rows.push(lb)
          for (const k in a) {
            const v = a[k]
            if (v) {
              toShow = isObject(v) ? util.inspect(v, false, null) : v
              rows.push([k + ':', toShow].join(' '))
            }
          }
        } else {
          rows.push(a)
        }
      })
      rows.push([lb, 'END'].join(' '))
    } else if (isObject(_msg)) {
      rows.push(lb)
      for (const k in _msg) {
        rows.push([k + ':', _msg[k]].join(' '))
      }
      rows.push([lb + 'END'].join(' '))
    } else {
      // This is to accomdate the integration with other logging system sending back different messages
      rows.push(
        ['MESSAGES:', util.inspect(_msg, false, null)].join(
          ' '
        )
      )
    }
  }
  table(rows)
}
