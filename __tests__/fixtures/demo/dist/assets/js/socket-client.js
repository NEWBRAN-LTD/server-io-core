$(function() {
  const client = io('http://localhost:8000');

  client.on('connect', function(socket) {
    socket.on('news', function(data) {
      console.info('got news', data);
    });
  });
  
});
