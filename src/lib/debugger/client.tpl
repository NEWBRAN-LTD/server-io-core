(function(window , navigator, StackTrace)
{
  'use strict';
  var nsp = io('<%= debuggerPath %>');
  /**
   * @param {object} payload send to the server
   */
  var send = function(payload) {
    payload.browser = navigator.userAgent;
    payload.location = window.location.href;
    nsp.emit('<%= eventName %>', payload);
  };

  /**
   * listen to the init connection
   */
  nsp.on('hello', function (msg) {
    console.log('debugger init connection: ' , msg);
  });

  /**
   * core implementation
   */
  window.onerror = function(msg, file, line, col, error) {
    // callback is called with an Array[StackFrame]
    StackTrace.fromError(error)
      .then(function(data) {
        send({msg: data, from: 'error', color: 'warning'});
      })
      .catch(function(err) {
        send({msg: err, from: 'catch onerror', color: 'debug'});
      });
  };

  /**
   * added on V1.4.0
   */
  window.onunhandledrejection = function(e) {
    StackTrace.fromError(e)
      .then(function(data) {
        send({msg: data, from: 'onunhandledrejection', color: 'warning'});
      })
      .catch(function(err) {
        send({msg: err, from: 'catch onunhandledrejection', color: 'debug'});
      });
  }
<% if (consoleDebug) { %>

  /**
   * added on V1.5.0 overwrite the console.debug
   */
  console.debug = function() {
    var args = Array.prototype.slice.call(arguments);
    send({msg: args, from: 'debug'});
  };
<% } %>
})(window , navigator, StackTrace);
