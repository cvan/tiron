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
    var score = Math.abs(diff);

    if (score >= MAX_SCORE) {
      gameOver = true;
      var winner = {
        type: 'end',
        winner: diff > 0 ? 'A' : 'B',
        score: score,
        scores: scores
      };
      server.broadcast(JSON.stringify(winner));
      scores.A = 0;
      scores.B = 0;
    } else {
      var gameScores = {
        type: 'scores',
        scores: scores
      };
      server.broadcast(JSON.stringify(gameScores));
    }
  }

  function rematch () {
    scores.A = 0;
    scores.B = 0;
    gameOver = false;
    tug(0);
  }

  client.on('message', function (msg) {
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
        if (!gameOver) {
          tug(1);
        }
        break;
      case 'rematch':
        if (gameOver) {
          rematch();
        }
        break;
    }
  });

  var teamAssignment = {
    type: 'team',
    team: team
  };

  client.send(JSON.stringify(teamAssignment));

  tug(0);
});
