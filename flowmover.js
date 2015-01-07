
var argv = require('yargs')
  .usage('Usage: $0 [options]')
  .example('$0 -o console', 'Reformat and output messages to the screen (as a preview, or can be piped to a file)')
  .example('$0 -o file', 'Reformat and output messages to a file (chatlog.txt) by default')
  .example('$0 -o file -f export.txt', 'Reformat and output messages to a specified filename (export.txt)')
  .example('$0 -o flow', 'Reformat and output messages to a new flow as the user specified in `config.json`')
  .options('o', {
    alias: 'output',
    required: true,
    description: 'Output log to one of (log|console|flow)'
  })
  .options('f', {
    alias: 'file',
    default: 'chatlog.txt',
    description: 'Export messages to an IRC-style text file'
  })
  .argv;

var config = require('./config.json');
var oldFlowContents = require('./messages.json');

var moment = require('moment');
var fs = require('fs');
var Session = require('flowdock').Session;
var session = new Session(config.email, config.password);

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
  var formattedMessage;
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
  } else {
    formattedMessage = 'Unknown message type: ' + message;
  }
  return '[' + timestamp(message.sent) + '] ' + users[message.user].nick + ': ' + formattedMessage;
}


getFlow(session, config.flowName, function(flow){
  getUsers(session, function(users) {
    oldFlowContents.map(function(message) {
      var msg = formatMessage(message, users);
      if (argv.output === 'console') {
        console.log(msg);
      }
      if (argv.output === 'file') {
        fs.appendFileSync(argv.file, msg + "\n", encoding='utf8')
      }
      if (argv.output === 'flow') {
        session.message(flow.id, msg);
      }
    });
  });
});



