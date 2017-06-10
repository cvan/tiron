(function () {
  var logsEl = document.querySelector('#logs');

  function appendMsg (msg, type) {
    var p = document.createElement('p');
    p.setAttribute('data-log-type', type || 'log');
    p.textContent = msg;
    logsEl.appendChild(p);
    logsEl.scrollIntoView();
  }

  function appendLog (msg) {
    appendMsg(msg, 'log');
  }

  function appendError (msg) {
    appendMsg(msg, 'error');
  }

  window.onerror = function (err) {
    appendError(msg);
  };

  var tug = function () {
    appendLog('tug!');
  };

  var debug = window.location.search.indexOf('?debug') > -1 ||
              window.location.search.indexOf('&debug') > -1;
  var touch = 'ontouchstart' in window || (
    window.location.search.indexOf('?touch') > -1 ||
    window.location.search.indexOf('&touch') > -1);
  if (debug) {
    document.documentElement.setAttribute('data-debug', 'true');
  }
  if (touch) {
    document.documentElement.setAttribute('data-touch', 'true');
    document.addEventListener('touchstart', function (evt) {
      evt.preventDefault();
      tug();
    });
  } else {
    document.addEventListener('click', function (evt) {
      evt.preventDefault();
      tug();
    });
  }

  var WS_PROTOCOL = 'ws:';
  var WS_HOST = window.location.hostname;
  var WS_PORT = 4000;

  var conn = new WebSocket(WS_PROTOCOL + '//' + WS_HOST + ':' + WS_PORT);

  var randomNames = [
    'Roberto',
    'Cristóbal',
    'Alonzo',
    'Miguel',
    'Joaquín',
    'Lupé',
    'Rosa',

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

  var pinataEl = document.querySelector('#pinata');

  var winnerEl = document.createElement('div');
  winnerEl.id = 'winner';
  winnerEl.className = 'winner hidden';
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

  var gameOver = false;
  var scores = {
    A: 0,
    B: 0
  };

  conn.onmessage = function (msg) {
    var data = JSON.parse(msg.data);

    // console.log('msg received', data);

    var type = data.type;

    if (type === 'team') {
      document.documentElement.setAttribute('data-team', data.team);
      teamNameEl.setAttribute('data-team', data.team);
      teamNameEl.textContent = data.team;
      saveTeam(data.team);

    } else if (type === 'scores') {
      scores = data.scores;

      // console.log('diff', Math.abs(scores.B - scores.A));
      // pinataEl.style.cssText += 'margin-right: calc(50% - 160px)';
      // pinataEl.style.cssText += 'margin-right: calc(' + (50 + Math.abs(scores.B - scores.A) * 2) + '% - 160px)';
      pinataEl.style.cssText += 'margin-right: calc(' + (50 + (scores.B - scores.A) * 2) + '% - 160px)';

      teamASideEl.setAttribute('style', 'flex: ' + data.scores.A);
      teamAScoreEl.setAttribute('data-score', data.scores.A);
      teamAScoreEl.textContent = data.scores.A;

      teamBSideEl.setAttribute('style', 'flex: ' + data.scores.B);
      teamBScoreEl.setAttribute('data-score', data.scores.B);
      teamBScoreEl.textContent = data.scores.B;

    } else if (type === 'end') {
      gameOver = true;
      document.documentElement.setAttribute('data-gg', data.winner);

      winnerEl.classList.remove('hidden');
      winnerEl.setAttribute('data-team', data.winner);
      winnerEl.textContent = 'Team ' + data.winner + ' wins!';

    }
  };

  function rematch () {
    gameOver = false;
    conn.send(JSON.stringify({type: 'rematch'}));
    setTimeout(function () {
      winnerEl.textContent = 'Rematch!';

      setTimeout(function () {
        winnerEl.classList.add('hidden');
        winnerEl.textContent = '';
      }, 1500);

      document.documentElement.removeAttribute('data-gg');
    }, 500);
  }

  conn.onopen = function () {
    if (!gameOver) {
      conn.send(JSON.stringify({type: 'rematch'}));
    }
    // console.log('open');
    tug = function () {
      conn.send(JSON.stringify({type: 'tug'}));
    };
  };

  var clicksGG = 0;

  window.addEventListener('click', function (evt) {
    if (!evt.target || !evt.target.closest) {
      return;
    }

    if (gameOver) {
      if (clicksGG >= 1) {
        clicksGG = 0;
        rematch();
        if (evt) {
          evt.preventDefault();
          evt.stopPropagation();
        }
        return;
      }
      clicksGG++;
      return;
    }
    clicksGG = 0;

    if (evt.target.closest('a[href$="#reset"]')) {
      if (evt) {
        evt.preventDefault();
        evt.stopPropagation();
      }
      clearSavedData();
      window.location.href = window.location.origin + window.location.pathname;
    }
  });
})();
