$(document).ready(function() {
var chatDB = new Firebase('https://platypus-chat.firebaseio.com/');

var username;
var $username = $('#username');
var $go       = $('#go');
var $loading  = $('#loading');

init();


function init() {
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

  $go.show().click(startChat);
}


function startChat() {
  $loading.show();

  $username.prop('disabled', true);
  $go.prop('disabled', true);

  username = $username.val();
  $('#newMessage b').text('username: ' + username);

  firebaseInit();

  $go.closest('p').hide();
  $('#newMessage').show();

  $('#newMessage input').focus().keypress(sendMessage);
}


function sendMessage(e) {
  var $this = $(this);
  var message = $this.val();
  if (e.keyCode === 13 && message.length > 0) {
    $this.val('');
    $loading.show();
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
  // load the last 1024 messages and listen for new ones
  chatDB.limitToLast(1024).on('child_added', function(data) {
    $loading.hide();
    $('#newMessage input').prop('disabled', false).focus();

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
                          .append($bubble.css('color', '#060'));
    } else {
      $bubble = $('<div>').css('text-align', 'left')
                          .append($bubble);
    }

    $('#newMessage').after($bubble);
  });
}
});
