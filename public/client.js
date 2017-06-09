(function () {
  window.onerror = function (err) {
    document.body.innerHTML += err;
  };

  var WS_PROTOCOL = 'ws:';
  var WS_HOST = window.location.hostname;
  var WS_PORT = 4000;

  var conn = new WebSocket(WS_PROTOCOL + '//' + WS_HOST + ':' + WS_PORT);

  var randomNames = [
    'Roberto',
    'Cristóbal',
    'Alonzo',
    'Miguel',
    'Joaquín'
  ];

  // Source: https://stackoverflow.com/a/2380070
  function fisherYates (list, numItems) {
    for (var idx = list.length - 1; idx > 1; idx--) {
      var rand = Math.floor(Math.random() * idx);
      var t = list[idx];
      list[idx] = list[rand];
      list[rand] = t;
    }
    return list.slice(0, numItems);
  }

  function getRandomName () {
    return fisherYates(randomNames, 1);
  }

  function clearSavedData () {
    try {
      delete localStorage.currentPlayer;
      delete localStorage.currentTeam;
    } catch (e) {
    }
  }

  function loadPlayer () {
    var player;
    try {
      player = localStorage.currentPlayer;
    } catch (e) {
      player = null;
    }
    if (!player) {
      var defaultName = getRandomName();
      player = prompt('¿Cómo se llama, muchacho y muchacha?', defaultName);
      if (!player) {
        player = defaultName;
      }
      savePlayer(player);
    }
    return player;
  }

  function savePlayer (player) {
    try {
      localStorage.currentPlayer = player;
    } catch (e) {
    }
  }

  var currentPlayer = loadPlayer();
  var currentTeam = loadTeam();

  var playerEl = document.querySelector('#player');
  playerEl.textContent = currentPlayer;

  var teamASideEl = document.querySelector('#side-a');
  var teamBSideEl = document.querySelector('#side-b');

  var teamAScoreEl = document.querySelector('#score-a');
  var teamBScoreEl = document.querySelector('#score-b');

  var teamNameEl = document.querySelector('#team-name');

  var winnerEl = document.createElement('div');
  winnerEl.id = 'winner';
  winnerEl.className = 'winner';
  document.body.appendChild(winnerEl);

  function loadTeam () {
    try {
      return localStorage.currentTeam;
    } catch (e) {
      return null;
    }
  }

  function saveTeam (team) {
    if (!team) {
      currentTeam = null;
    }
    try {
      localStorage.currentTeam = team ? team : null;
    } catch (e) {
    }
  }

  loadTeam();

  var maxScore = 50;

  conn.onmessage = function (msg) {
    var data = JSON.parse(msg.data);

    console.log('msg received', data);

    var type = data.type;

    if (type === 'team') {
      document.documentElement.setAttribute('data-team', data.team);
      teamNameEl.setAttribute('data-team', data.team);
      teamNameEl.textContent = data.team;
      saveTeam(data.team);

    } else if (type === 'scores') {
      teamASideEl.setAttribute('style', 'flex: ' + data.scores.A);
      teamAScoreEl.setAttribute('data-score', data.scores.A);
      teamAScoreEl.textContent = data.scores.A;

      teamBSideEl.setAttribute('style', 'flex: ' + data.scores.B);
      teamBScoreEl.setAttribute('data-score', data.scores.B);
      teamBScoreEl.textContent = data.scores.B;

    } else if (type === 'end') {
      winnerEl.setAttribute('data-team', data.winner);
      winnerEl.textContent = 'Team ' + data.winner + ' wins!';
    }
  };

  conn.onopen = function () {
    window.addEventListener('click', function () {
      conn.send(JSON.stringify({type: 'tug'}));
    });
  };

  window.addEventListener('click', function (evt) {
    if (!evt.target || !evt.target.closest || !evt.target.closest('a[href$="#reset"]')) {
      return;
    }
    evt.preventDefault();
    evt.stopPropagation();
    clearSavedData();
    window.location.href = window.location.origin + window.location.pathname;
  });
})();
