
var argv = require('yargs')
  .usage('Usage: $0 [options]')
  .example('$0 -e me@example.com -p myPas$w0rd -f \'My flow\' -o log', 'Reformat and output messages to the screen (as a preview, or can be piped to a file)')
  .example('$0 -e me@example.com -p myPas$w0rd -f \'My flow\' -o log > export.txt', 'Reformat and output messages to a specified filename')
  .example('$0 -e me@example.com -p myPas$w0rd -f \'My flow\' -o flow', 'Reformat and output messages to the `My Flow` flow')
  .options('e', {
    alias: 'email',
    required: true,
    description: 'Email of user to connect to Flowdock API with'
  })
  .options('p', {
    alias: 'password',
    required: true,
    description: 'Password to connect to Flowdock API with'
  })
  .options('f', {
    alias: 'flow',
    required: true,
    description: 'Flowdock flow (room) to scan for users and post to'
  })
  .options('o', {
    alias: 'output',
    required: true,
    description: 'Output log to one of (log|flow)'
  })
  .argv;

var oldFlowContents = require('./messages.json');
var moment = require('moment');
var fs = require('fs');
var Session = require('flowdock').Session;
var session = new Session(argv.email, argv.password);

function getFlow(session, flowName, callback) {
  var foundFlow;
  session.flows(function(err, flows){
    foundFlow = flows.filter(function(flow) {
      return (flow.name === flowName);
    });
    callback(foundFlow[0]);
  });
}

function getUsers(session, callback) {
  var users = {};
  session.flows(function(err, flows) {
    flows.map(function(flow) {
      flow.users.map(function(user) {
        users[user.id] = user;
      });
    });
    callback(users);
  });
}

function timestamp(unixtime) {
  return moment.unix(unixtime).format('MMM DD, HH:mm:ss A');
}

function formatMessage(message, users) {
  var formattedMessage = '', nick = '';
  if (message.event === 'action') {
    if (message.content.type === 'invite') {
      formattedMessage = 'Invited '+ message.content.email + ' to flow.';
    } else if (message.content.type === 'join') {
      formattedMessage = 'joined the flow.';
    }
  } else if (message.event === 'file') {
    formattedMessage = 'Uploaded file ' + message.content.file_name;
  } else if (message.event === 'comment') {
    formattedMessage = message.content.text;
  } else if (message.event === 'message') {
    formattedMessage = message.content;
  } else if (message.event === 'user-edit') {
    formattedMessage = message.content.user.name + ' is now known as ' + message.content.user.nick;
  } else if (message.event === 'rss') {
    formattedMessage = 'RSS:' + message.content.title + ' posted to ' + message.content.link;
  } else if (message.event === 'line') {
    formattedMessage = message.content;
  } else if (message.event === 'vcs') {
    if (message.content.pusher && message.content.pusher.name) {
      formattedMessage = message.content.pusher.name + ' pushed some commits to ' + message.content.compare;
    } else if (message.content.event === 'gollum') {
      if (message.content.pages) {
        for (var i=0; message.content.pages.length > i; i++) {
          var page = message.content.pages[i]
          formattedMessage = formattedMessage + message.content.sender.login + ' ' + page.action + ' wiki page ' + page.title + ' at ' + page.html_url + "\n";
        }
      }
    }
  } else if (message.event === 'mail') {
    formattedMessage = message.content.subject;
  } else {
    formattedMessage = 'Unknown message type: ' + message;
    console.log(message);
  }
  if (users[message.user] && users[message.user].nick) {
    nick = users[message.user].nick + ': ';
  }
  return '[' + timestamp(message.sent) + '] ' + nick + formattedMessage;
}


getFlow(session, argv.room, function(flow){
  getUsers(session, function(users) {
    oldFlowContents.map(function(message) {
      var msg = formatMessage(message, users);
      if (argv.output === 'log') {
        console.log(msg);
      }
      if (argv.output === 'flow') {
        session.message(flow.id, msg);
      }
    });
  });
});



