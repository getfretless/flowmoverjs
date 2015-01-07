# FlowmoverJS

NodeJS tool to restore [Flowdock](http://flowdock.com) export messages.json files to a new flow or a chatlog text file

## Installation

    git clone https://github.com/getfretless/flowmoverjs.git
    cd flowmover
    npm install

## Setup

Open `config.json` with a text editor and edit the following information:

    {
      "flowName": "My Flow",
      "email": "emailOfTheUserToPostAs",
      "password": "passwordOfTheUserToPostAs"
    }

Then, go to your account page in Flowdock, and request an export for the flow you want to move.
Flowdock will email you a zip file with a `messages.json` file inside, copy that into this directory.

## Running

    node flowmover.js -o console

If all goes well, you'll see a flurry of messages in an IRC-style format fly by in your terminal:

    [Sep 21, 07:24:15 AM] davejones: If you use Time or Date in a scope, then the scope is only evaulated the first time the model is loaded.

If you run with the `-o file` option, the log will be dumped to a text file (default `chatlog.txt`).

If you run with the `-o flow` option, the user you setup to post as will post a new message entry in the flow specified in `config.json` for every old message in `messages.json`.

Run without any options to see more examples:

    node flowmover.js

## Licence

MIT