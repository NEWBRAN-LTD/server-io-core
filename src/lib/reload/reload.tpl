(function()
{
  'use strict';
  var nsp = io('<%= reloadNamespace %>');

  nsp.on('hello', function(msg) {
    console.log('reload nsp init connection', msg);
  });

  nsp.on('error', function(err) {
    console.error('error', error);
  });

  nsp.on('<%= eventName %>', function(payload) {
    // js 1.2 (latest)
    window.location.reload(true);
  });

})();
