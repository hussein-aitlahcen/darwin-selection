var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var db = require('./db');

db.connection.once('open', function() {
    console.log('sucessfully connected to database');
    var answer = new db.Answer({ id: 0, description: 'Jacques Chirac' });
    answer.save(function(error, doc) {
        console.log("saved object:" + doc);
    });
});

server.listen(8080);

app.use(express.static('public'));

app.get('/', function(req, res) {
    res.sendfile('public/index.html');
});

io.on('connection', function(socket) {
    console.log('websocket connection');
});