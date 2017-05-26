var socket = io();
console.log("Socket : on");

var CMSG_NICKNAME = 'client.nickname';
var CMSG_GAME_STATE_ACK = 'client.game.state.ack';
var CMSG_GAME_ANSWER = 'client.game.answer';
var CMSG_CHAT_MESSAGE = 'client.chat.message'

var SMSG_NICKNAME_ACK = 'server.nickname.ack'
var SMSG_PLAYERS_LIST = 'server.players.list';
var SMSG_GAME_STATE_UPDATE = 'server.game.state.update';
var SMSG_GAME_QUESTION = 'server.game.question';
var SMSG_PLAYERS_SCORE = 'server.players.score';
var SMSG_GAME_PLAYERS = 'server.game.players';
var SMSG_CHAT_MESSAGE = 'server.chat.message';
var SMSG_PLAYER_JOIN = 'server.player.join';             
var SMSG_PLAYER_LEAVE = 'server.player.leave'; 

var GAMESTATE_PLAYERS_WAITING = 1;
var GAMESTATE_GAME_START = 2;
var GAMESTATE_TURN_BEGIN = 3;
var GAMESTATE_TURN_MIDDLE = 4;
var GAMESTATE_TURN_END = 5;
var GAMESTATE_GAME_END = 6;  
var GAMESTATE_TIMER = 7;

var MSG_PLAYERS_WAITING = "En attente de joueurs";
var MSG_NO_QUESTION = "La partie va commencer dans un instant";
var MSG_GAME_END = "Une nouvelle partie va commencer";

function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
    return a;
}