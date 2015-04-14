(function () {

  var conn = new WebSocket('ws://10.10.45.39:4000');

  var teamA = $('#team-a');
  var teamAScore = teamA.find('.score');
  var teamBScore = $('#team-b').find('.score');
  var body = $(document.body);

  conn.onmessage = function (messageObject) {
    var data = JSON.parse(messageObject.data);
    if (data.type === 'team') {
      $('#team-name').text(data.team);
    } else if (data.type === 'scores') {
      teamAScore.text(data.scores.A);
      teamBScore.text(data.scores.B);
    } else if (data.type === 'end') {
      var winner = $('<div>');
      winner.addClass('winner').text('Team ' + data.winner + ' wins!');
      body.prepend(winner);
    }
  };

  conn.onopen = function () {
    body.on('click', function () {
      conn.send('click');
    });
  };

})();