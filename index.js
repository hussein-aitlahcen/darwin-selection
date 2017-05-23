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
var TIMEOUT_EPSILON = 1.1

class Player {
    constructor(id, nickname) {
        this.id = id
        this.nickname = nickname
        this.life = PLAYER_DEFAULT_LIFE
    }

    gameStart() {
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
        this.clientsPlaying = []
        this.timer = null
        this.nextPlayerId = 0
        this.questions = questions
        this.currentQuestion = null
        this.currentAnswers = []
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
                that.handleNicknameRequest(client, message.nickname)
            })
            client.on(net.CMSG_GAME_ANSWER, function(message) {
                console.log('client answered')
                that.handleAnswer(client, message.answerId)
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

    broadcastConnectedPlayers() {
        this.broadcast(net.SMSG_PLAYERS_LIST, {
            players: this.clients.filter(c => c.player !== null).map(c => c.player)
        })
    }

    broadcastGamePlayersList() {
        this.broadcast(net.SMSG_GAME_PLAYERS, {
            players: this.clientsPlaying.map(c => c.player)
        })
    }

    handleNicknameRequest(client, nickname) {
        client.player = new Player(
            this.getNextId(),
            nickname
        )
        client.emit(net.SMSG_NICKNAME_ACK, { player: client.player })
        this.broadcastConnectedPlayers()
    }

    isPlaying(client) {
        return this.clientsPlaying.filter(c => c === client).length === 1
    }

    handleAnswer(client, answerId) {
        if (!this.isPlaying(client)) {
            console.log('received answer from unknow player: ' + client.player.nickname)
            return
        }
        this.currentAnswers.push({
            playerId: client.player.id,
            answerId: answerId
        })
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
        this.broadcastConnectedPlayers()
        client.emit(net.SMSG_GAME_STATE_UPDATE, {
            state: this.state
        })
    }

    playerLeave(client) {
        console.log('client left')
        this.clients = this.clients.filter(c => c !== client)
        this.clientsPlaying = this.clientsPlaying.filter(c => c !== client)
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
            console.log('timer fired')
        }
    }

    gameStart() {
        console.log('game started')
        this.clientsPlaying.splice(0, this.clientsPlaying.length)
        this.clientsPlaying = this.clients.filter(c => c.player !== null)
        this.clientsPlaying.forEach(function(client) {
            client.player.gameStart()
        }, this)
        this.goToGameState(GAMESTATE_TURN_BEGIN)
    }

    resetTurn() {
        this.currentAnswers = []
    }

    selectRandomQuestion() {
        var maxIndex = this.questions.length
        var questionIndex = Math.floor(Math.random() * maxIndex)
        this.currentQuestion = this.questions[questionIndex]
        this.questions.splice(questionIndex, 1)
    }

    computeAnswerTimeout() {
        var timeout = TIME_PER_QUESTION * this.currentQuestion.getTimeoutFactor()
        console.log('question timeout: ' + timeout)
        this.setTimer(timeout * TIMEOUT_EPSILON, GAMESTATE_TURN_END, function() {})
        return timeout
    }

    turnBegin() {
        this.resetTurn()
        this.selectRandomQuestion()
        var timeout = this.computeAnswerTimeout()
        this.broadcast(net.SMSG_GAME_QUESTION, {
            timeout: timeout,
            question: this.currentQuestion
        })
        this.goToGameState(GAMESTATE_TURN_MIDDLE)
    }

    turnMiddle(dt) {
        this.updateTimer(dt)
        if (this.currentAnswers.length === this.clientsPlaying.length) {
            this.goToGameState(GAMESTATE_TURN_END)
        }
    }

    computePlayersScore() {
        var bonus = true
        var clientThatAnswered = []
        for (var i = 0; i < this.currentAnswers.length; i++) {
            var answer = this.currentAnswers[i]
            var client = this.clientsPlaying.find(c => c.player.id === answer.playerId)
            clientThatAnswered.push(client)
            if (answer.answerId === 0) {
                if (bonus) {
                    bonus = false
                    client.player.life++
                }
            } else {
                client.player.life--
            }
            console.log(client.player)
        }
        for (var i = 0; i < this.clientsPlaying.length; i++) {
            var client = this.clientsPlaying[i]
            if (clientThatAnswered.filter(c => c === client).length === 0) {
                client.player.life--
                    console.log(client.player)
            }
        }
    }

    turnEnd() {
        this.computePlayersScore()
        var alivePlayers = this.clientsPlaying.filter(client => client.player.life > 0)
        if (alivePlayers.length > 1) {
            this.goToGameState(GAMESTATE_TURN_BEGIN)
        } else {
            this.goToGameState(GAMESTATE_GAME_END)
        }
    }

    gameEnd() {
        console.log('game ended')
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