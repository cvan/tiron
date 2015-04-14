var ws = require('ws');

var server = new ws.Server({port: 4000});

server.broadcast = function (message) {
  this.clients.forEach(function (client) {
    client.send(message);
  });
};

server.on('connection', function (client) {
  console.log('New connection!');

  client.on('message', server.broadcast.bind(server));

});