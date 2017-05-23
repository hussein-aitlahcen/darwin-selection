'use strict'

var express = require('express')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)
var db = require('./db')
var net = require('./net')
var createGame = require('gameloop')

var TIME_PER_QUESTION = 5
var TIME_BEFORE_GAME_START = 2
var MIN_PLAYERS_TO_PLAY = 3
var PLAYER_DEFAULT_LIFE = 3

class Player {
    constructor(id, nickname) {
        this.id = id
        this.nickname = nickname
        this.life = PLAYER_DEFAULT_LIFE
    }
}

var GAMESTATE_PLAYERS_WAITING = 1
var GAMESTATE_TIMER = 7
var GAMESTATE_GAME_START = 2
var GAMESTATE_TURN_BEGIN = 3
var GAMESTATE_TURN_MIDDLE = 4
var GAMESTATE_TURN_END = 5
var GAMESTATE_GAME_END = 6

class Timer {
    constructor(time, callback) {
        this.time = time
        this.callback = callback
        this.expired = false
    }

    update(dt) {
        this.time -= dt
        if (this.time <= 0) {
            this.callback()
            this.expired = true
        }
    }
}

class Game {
    constructor(questions) {
        this.state = GAMESTATE_PLAYERS_WAITING
        this.core = createGame()
        this.clients = []
        this.players = []
        this.timer = null
        this.nextPlayerId = 0
        this.questions = questions
        this.currentQuestion = null
    }

    getNextId() {
        return this.nextPlayerId++
    }

    start() {
        let that = this
        this.core.on('update', dt => that.update(dt))
        this.core.start()
        io.on('connection', function(client) {
            that.playerJoin(client)
            client.on(net.CMSG_NICKNAME, function(message) {
                console.log('client nickname received -> ' + message.nickname)
                client.player = new Player(
                    that.getNextId(),
                    message.nickname
                )
            })
            client.on('disconnect', function() {
                that.playerLeave(client)
            })
        })
    }

    update(dt) {
        switch (this.state) {
            case GAMESTATE_PLAYERS_WAITING:
                this.waitingPlayers()
                break

            case GAMESTATE_TIMER:
                this.updateTimer(dt)
                break

            case GAMESTATE_GAME_START:
                this.gameStart()
                break

            case GAMESTATE_TURN_BEGIN:
                this.turnBegin()
                break

            case GAMESTATE_TURN_MIDDLE:
                this.turnMiddle(dt)
                break

            case GAMESTATE_TURN_END:
                this.turnEnd()
                break

            case GAMESTATE_GAME_END:
                this.gameEnd()
                break
        }
    }

    broadcast(id, content) {
        io.sockets.emit(id, content)
    }

    goToGameState(state) {
        this.state = state
        this.broadcast(net.SMSG_GAME_STATE_UPDATE, {
            state: this.state
        })
        console.log('gamestate update -> ' + this.state)
    }

    setTimer(time, nextState, callback) {
        var that = this
        this.timer = new Timer(time, function() {
            callback()
            that.goToGameState(nextState)
        })
    }

    playerJoin(client) {
        console.log('client joined')
        client.player = null
        this.clients.push(client)
    }

    playerLeave(client) {
        console.log('client left')
        this.clients = this.clients.filter(c => c !== client)
        this.players = this.players.filter(c => c !== client)
    }

    waitingPlayers() {
        var realPlayers = this.clients.filter(c => c.player !== null)
        if (realPlayers.length >= MIN_PLAYERS_TO_PLAY) {
            this.goToGameState(GAMESTATE_TIMER)
            this.setTimer(TIME_BEFORE_GAME_START, GAMESTATE_GAME_START, function() {})
        }
    }

    updateTimer(dt) {
        if (this.timer === null) {
            console.log('null timer object')
        }
        this.timer.update(dt)
        if (this.timer.expired) {
            this.timer = null
        }
    }

    gameStart() {
        this.players.splice(0, this.players.length)
        for (var i = 0; i < this.clients.length; i++) {
            var client = this.clients[i]
            if (client.player !== null) {
                this.players.push(client)
            }
        }
        this.goToGameState(GAMESTATE_TURN_BEGIN)
    }

    turnBegin() {
        var maxIndex = this.questions.length
        var questionIndex = Math.floor(Math.random() * maxIndex)
        this.currentQuestion = this.questions[questionIndex]
        this.questions.splice(questionIndex, 1)
        var timeout = TIME_PER_QUESTION * this.currentQuestion.getTimeoutFactor()
        console.log('question timeout: ' + timeout)
        this.setTimer(timeout, GAMESTATE_TURN_END, function() {})
        this.goToGameState(GAMESTATE_TURN_MIDDLE)
        this.broadcast(net.SMSG_GAME_QUESTION, {
            timeout: timeout,
            question: this.currentQuestion
        })
    }

    turnMiddle(dt) {
        this.updateTimer(dt)
    }

    turnEnd() {
        var alivePlayers = this.players.filter(client => client.player.life > 0)
        if (alivePlayers.length > 1) {
            this.goToGameState(GAMESTATE_TURN_BEGIN)
        } else {
            this.goToGameState(GAMESTATE_GAME_END)
        }
    }

    gameEnd() {
        this.goToGameState(GAMESTATE_PLAYERS_WAITING)
    }
}

db.connection.once('open', function() {
    console.log('sucessfully connected to database')
    db.Question.find({}, function(error, questions) {
        new Game(questions).start()
    })
})

server.listen(8080)

app.use(express.static('public'))

app.get('/', function(req, res) {
    res.sendfile('public/index.html')
})