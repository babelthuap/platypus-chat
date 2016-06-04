$(document).ready(function() {
'use strict';

var username;
var chatDB = new Firebase('https://platypus-chat.firebaseio.com/');

var $username = $('#username');
var $go = $('#go');

$username.focus();

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

$go.click(startChat);

function startChat() {
  username = $username.val();
  $('#newMessage b').text('username: ' + username);

  firebaseInit();

  $go.closest('p').hide();
  $('#newMessage').show();

  $('#newMessage input').focus().keypress(function(e) {
    var $this = $(this);
    var message = $this.val();
    if (e.keyCode === 13 && message.length > 0) {
      chatDB.push({
        user: username,
        message: message,
        time: Date.now()
      }).then(function() {
        $this.val('');
      }).catch(function(err) {
        console.error('Error writing new message to Firebase: ', err);
      });
    }
  });
}

function firebaseInit() {
  // load the last 1024 messages and listen for new ones
  chatDB.limitToLast(1024).on('child_added', function(data) {
    var val = data.val();

    var $bubble = $('<div>')
      .addClass('message')
      .text( val.message )
      .prepend( $('<b>').text(val.user + ': ') );

    if (val.time) {
      $bubble = $bubble.append( $('<br>') )
          .append( $('<em>').text((new Date(val.time)).toLocaleString()) );
    }

    if (val.user.replace(/\s/g, '').toLowerCase() ==
        username.replace(/\s/g, '').toLowerCase()) {
      $bubble = $('<div>').css('text-align', 'right')
                          .append($bubble.css('color', '#006'));
    } else {
      $bubble = $('<div>').css('text-align', 'left')
                          .append($bubble);
    }

    $('#newMessage').after($bubble);
  });
}
});
