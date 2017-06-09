var ws = require('ws');

var port = process.env.WS_PORT || 4000;

var server = new ws.Server({port: port});
var gameOver = false;
var clients = {};
var clientIdCount = 0;
var teams = {
  A: [],
  B: []
};
var scores = {
  A: 0,
  B: 0
};
var MAX_SCORE = 20;  // Number of tugs.

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
  if (gameOver) {
    return;
  }

  var clientId = ++clientIdCount;
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

  function name () {
    playerName = playerName;
  }

  function tug (increment) {
    console.log('Client ' + clientId + ' tugged!');

    scores[team] += increment;
    var diff = scores.A - scores.B;

    if (Math.abs(diff) >= MAX_SCORE) {
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

  client.on('message', function (msg) {
    if (gameOver) {
      return;
    }

    var data;
    try {
      data = JSON.parse(msg);
    } catch (e) {
    }
    if (!data) {
      return;
    }

    var type = data.type;

    switch (type) {
      case 'name':
        return name(data.name);
      case 'tug':
        return tug(1);
    }
  });

  var teamAssignment = {
    type: 'team',
    team: team
  };

  client.send(JSON.stringify(teamAssignment));

  tug(0);
});
