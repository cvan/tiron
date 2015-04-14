(function () {

  var conn = new WebSocket('ws://localhost:4000');

  conn.onopen = function () {
    conn.send('Hello there!');
  };

  var form = $('form');
  var msg = $('[name=msg]');

  conn.onmessage = function (messageObject) {
    var p = $('<p>');
    p.text(messageObject.data);
    p.insertBefore(form);
  };

  form.on('submit', function () {
    var message = msg.val();
    conn.send(message);
    msg.val('');
    return false;
  });

})();