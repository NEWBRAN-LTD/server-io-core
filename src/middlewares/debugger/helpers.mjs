/**
 * Take out a bunch of functions from the original debugger setup
 */
import util from 'node:util'
import chalk from 'chalk'
import { logutil, forEach, isString, isObject } from '../../utils/common.mjs'

const keys = ['browser', 'location']
const lb = chalk.white('-'.repeat(90))
const colorTable = { debug: 'red', info: 'magenta', warning: 'yellow' }

/**
 * Just getting some color configuration
 * @param {object} data from config
 * @return {string} color
 */
export function getColor (data) {
  const dc = 'cyan'
  const str = data.color ? data.color
    : data.from
      ? data.from : dc
  if (str === dc) {
    return str // Default
  }
  if (colorTable[str]) {
    return table[str]
  }
  if (chalk[str]) {
    return str
  }
  return dc
}

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
  const color = getColor(e)
  const rows = []
  if (e.from && e.color) {
    rows.push(chalk.white(`FROM: ${e.from}`))
  }
  keys.forEach((key) => {
    if (e[key]) {
      rows.push([chalk.white(key + ':'), chalk.cyan(e[key])].join(' '))
    }
  })
  const _msg = parseObj(e.msg)
  if (isString(_msg)) {
    rows.push([chalk.white('MESSAGE:'), chalk[color](e.msg)].join(' '))
  } else {
    let toShow
    const msgToArr = isString(_msg) ? parseObj(_msg) : _msg
    if (Array.isArray(msgToArr)) {
      rows.push(chalk.white('MESSAGE(S):'))
      msgToArr.forEach(a => {
        if (typeof a === 'object') {
          rows.push(lb)
          forEach(a, (v, k) => {
            toShow = isObject(v) ? util.inspect(v, false, null) : v
            rows.push([chalk.white(k + ':'), chalk[color](toShow)].join(' '))
          })
        } else {
          rows.push(a)
        }
      })
      rows.push([lb, 'END'].join(' '))
    } else if (isObject(_msg)) {
      rows.push(lb)
      forEach(_msg, (v, k) => {
        rows.push([chalk.white(k + ':'), chalk[color](v)].join(' '))
      })
      rows.push([lb + 'END'].join(' '))
    } else {
      // This is to accomdate the integration with other logging system sending back different messages
      rows.push(
        [chalk.white('MESSAGES:'), chalk[color](util.inspect(_msg, false, null))].join(
          ' '
        )
      )
    }
  }
  table(rows)
}
