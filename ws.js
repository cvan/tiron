var ws = require('ws');

var server = new ws.Server({port: 4000});
var gameOver = false;
var clients = {};
var clientIdSequence = 0;
var teams = {
  A: [],
  B: []
};
var scores = {
  A: 0,
  B: 0
};

server.broadcast = function (message) {
  this.clients.forEach(function (client) {
    try {
      client.send(message);
    } catch (err) {
      console.log('Oops!');
    }
  });
};

server.on('connection', function (client) {
  if (gameOver) return;
  var clientId = ++clientIdSequence;
  clients[clientId] = client;

  var team;
  if (teams.A.length <= teams.B.length) {
    team = 'A';
    teams.A.push(clientId);
  } else {
    team = 'B';
    teams.B.push(clientId);
  }

  console.log('Client ' + clientId + ' connected and put on team ' + team);

  console.log(teams);

  client.on('close', function () {
    console.log('Client ' + clientId + ' disconnected');
    teams[team].splice(teams[team].indexOf(clientId), 1);
    delete clients[clientId];
  });

  client.on('message', function (message) {
    if (!gameOver && message === 'click') {
      console.log('Client ' + clientId + ' clicked!');
      scores[team] += 1;
      var diff = scores.A - scores.B;
      if (Math.abs(diff) >= 100) {
        gameOver = true;
        var winner = {
          type: 'end',
          winner: diff > 0 ? 'A' : 'B'
        };
        server.broadcast(JSON.stringify(winner));
      } else {
        var gameScores = {
          type: 'scores',
          scores: scores
        };
        server.broadcast(JSON.stringify(gameScores));
      }
    }
  });

  var teamAssignment = {
    type: 'team',
    team: team
  };

  client.send(JSON.stringify(teamAssignment));

});