var socket = io();
console.log("Socket : on");

var CMSG_NICKNAME = 'client.nickname';
var CMSG_GAME_STATE_ACK = 'client.game.state.ack';
var CMSG_GAME_ANSWER = 'client.game.answer';

var SMSG_PLAYERS_LIST = 'server.players.list';
var SMSG_GAME_STATE_UPDATE = 'server.game.state.update';
var SMSG_GAME_QUESTION = 'server.game.question';
var SMSG_PLAYERS_SCORE = 'server.players.score';