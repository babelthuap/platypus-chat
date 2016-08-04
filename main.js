$(document).ready(function() {
var chatDB = new Firebase('https://platypus-chat.firebaseio.com/');
var room = window.location.search.slice(1) || 'public';
chatDB = chatDB.child(room);

var username;
var $go       = $('#go');
var $spinner  = $('#chatlog .loading');
var $username = $('#username');
var msInDay   = 24 * 60 * 60 * 1000;
var msInWeek  = 7 * msInDay;
var dayNames  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var timestampCallbacks = [];

init();


function init() {
  $username.focus();

  switch ($username.val().length) {
    case 0: $username.val(localStorage['username_' + room]);
      break;
    case 1: $go.prop('disabled', true);
      break;
  }

  $username.on('input', function() {
    if ($(this).val().length > 1) {
      $go.prop('disabled', false);
    } else {
      $go.prop('disabled', true);
    }
  });

  $username.keypress(function(e) {
    if (e.keyCode === 13 && !$go.prop('disabled')) {
      startChat();
    }
  });

  $('#header .loading').hide();

  $go.show().click(startChat);
}


function startChat() {
  $spinner.show();

  $username.prop('disabled', true);
  $go.prop('disabled', true);

  username = $username.val();
  localStorage['username_' + room] = username;
  $('#newMessage b').text('username: ' + username);

  firebaseInit();

  $go.closest('p').hide();
  $('#newMessage').show();

  $('#newMessage input').focus().keypress(sendMessage);

  // Update all timestamps once every 5 minutes.
  window.setInterval(function() {
    timestampCallbacks.forEach(function(callback) {
      callback();
    });
  }, 300000);
}


function sendMessage(e) {
  var $this = $(this);
  var message = $this.val();
  if (e.keyCode === 13 && message.length > 0) {
    $this.val('');
    $spinner.show();
    $('#newMessage input').prop('disabled', true);

    chatDB.push({
      user: username,
      message: message,
      time: Firebase.ServerValue.TIMESTAMP
    }).catch(function(err) {
      console.error('Error writing new message to Firebase: ', err);
    });
  }
}


function firebaseInit() {
  // load the last 256 messages and listen for new ones
  chatDB.limitToLast(256).on('child_added', function(data) {
    $spinner.hide();
    $('#newMessage input').prop('disabled', false).focus();

    var val = data.val();

    var $bubble = $('<div>')
      .addClass('message')
      .text( val.message )
      .prepend( $('<b>').text(val.user + ': ') );

    if (val.time) {
      $bubble = $bubble.append([
        $('<br>'),
        $('<em>').attr('id', val.time).text(formatDate(val.time))
      ]);

      timestampCallbacks.push(function() {
        $('#' + val.time).text(formatDate(val.time));
      });
    }

    if (val.user.replace(/\s/g, '').toLowerCase() == username.replace(/\s/g, '').toLowerCase()) {
      $bubble = $('<div>').addClass('right-msg')
                          .append($bubble.css('color', '#060'));
    } else {
      $bubble = $('<div>').addClass('left-msg')
                          .append($bubble);
    }

    $('#newMessage').after($bubble);
  });
}


function formatDate(dateInMs) {
  var date = new Date(dateInMs);
  var age = Date.now() - dateInMs;
  var isSameDayOfWeek = (new Date()).getDay() === date.getDay();
  if (age < msInDay) {
    var day = isSameDayOfWeek ? 'Today' : dayNames[date.getDay()];
    return day + ', ' + date.toLocaleTimeString();
  } else if (age < msInWeek && !isSameDayOfWeek) {
    var day = dayNames[date.getDay()];
    var time = (Number(date.toTimeString().split(':')[0]) < 12) ? 'morning' : 'afternoon'
    return day + ' ' + time;
  } else {
    return date.toLocaleString();
  }
}
});
