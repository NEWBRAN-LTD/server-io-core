'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/*
  Rethink about how to deal with templates
  The problem is the cjs version need to copy over the files
  and that's gonna be PIA, instead all templates now become
  string literal and makes it easier to deal with in different env
*/
const debuggerClientTpl = `
(function(window , navigator, StackTrace)
{
  'use strict'
  var nsp = io('<%= debuggerPath %>', {
    transports: ['websocket']
  })

  /**
   * @param {object} payload send to the server
   */
  var send = function(payload) {
    payload.browser = navigator.userAgent
    payload.location = window.location.href
    nsp.emit('<%= eventName %>', payload)
  }

  /**
   * listen to the init connection
   */
  nsp.on('hello', function (msg) {
    console.log('debugger init connection: ' , msg)
  })

  /**
   * core implementation
   */
  window.onerror = function(msg, file, line, col, error) {
    // callback is called with an Array[StackFrame]
    StackTrace.fromError(error)
      .then(function(data) {
        send({ msg: data, from: 'error', color: 'warning' })
      })
      .catch(function(err) {
        console.info('onerror', err)
        var _msg = { msg: msg, file: file, line: line, col: col }
        send({ msg: _msg, from: 'catch onerror', color: 'debug' })
      })
  }

  /**
   * handle the unhandled ajax rejection
   * @param {object} e Error
   */
  window.onunhandledrejection = function(e) {
    // console.info('onunhandledrejection', e)
    send({
      msg: e,
      from: 'onunhandledrejection',
      color: 'warning'
    })
    /* @TODO
    stack trace never able to parse the unhandle rejection
    StackTrace.fromError(e.reason || e)
      .then(function(data) {
        send({ msg: data, from: 'onunhandledrejection', color: 'warning' })
      })
      .catch(function(err) {
        console.error('onunhandledrejection', err)
        send({ msg: err, from: 'catch onunhandledrejection', color: 'debug' })
      })
    */
  }
<% if (consoleDebug) { %>
  /**
   * added on V1.5.0 overwrite the console.debug
   */
  console.debug = function() {
    var args = Array.prototype.slice.call(arguments)
    send({ msg: args, from: 'debug' })
  };
<% } %>
})(window , navigator, StackTrace)
`;

exports.debuggerClientTpl = debuggerClientTpl;
