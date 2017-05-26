'use strict'

var express = require('express')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)
var db = require('./db')
var net = require('./net')
var createGame = require('gameloop')

var TIME_PER_QUESTION = 8
var TIME_BEFORE_GAME_START = 2
var TIME_BETWEEN_TURN = 7
var TIME_END_GAME = 10
var MIN_PLAYERS_TO_PLAY = 3
var PLAYER_DEFAULT_LIFE = 3
var TIMEOUT_EPSILON = 0.2

class Player {
    constructor(id, nickname) {
        this.id = id
        this.nickname = nickname
        this.life = PLAYER_DEFAULT_LIFE
        this.dead = false
    }

    gameStart() {
        this.life = PLAYER_DEFAULT_LIFE
        this.game = false
    }

    getChatName() {
        return this.nickname + '#' + this.id
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
        this.baseQuestions = questions
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
            console.log('client joined')
            that.handlePlayerJoin(client)
            client.on(net.CMSG_NICKNAME, function(message) {
                console.log('client nickname received -> ' + message.nickname)
                that.handleNicknameRequest(client, message.nickname)
            })
            client.on(net.CMSG_GAME_ANSWER, function(message) {
                console.log('client answered')
                that.handleAnswer(client, message.answerId)
            })
            client.on(net.CMSG_CHAT_MESSAGE, function(message) {
                console.log('client chat message received')
                that.handleChatMessage(client, message)
            })
            client.on('disconnect', function() {
                console.log('client left')
                that.handlePlayerLeave(client)
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

    sendConnectedPlayers(client) {
        client.emit(net.SMSG_PLAYERS_LIST, {
            players: this.clients.filter(c => c.player !== null).map(c => c.player)
        })
    }

    sendPlayerJoin(client) {
        this.broadcast(net.SMSG_PLAYER_JOIN, {
            player: client.player
        })
    }

    sendPlayerLeave(player) {
        this.broadcast(net.SMSG_PLAYER_LEAVE, {
            player: player
        })
    }

    sendGamePlayerList(client) {
        client.emit(net.SMSG_GAME_PLAYERS, {
            players: this.clientsPlaying.map(c => c.player)
        })
    }

    sendGameState(client) {
        client.emit(net.SMSG_GAME_STATE_UPDATE, {
            state: this.state
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
        this.sendPlayerJoin(client)
    }

    handleChatMessage(client, message) {
        this.broadcast(net.SMSG_CHAT_MESSAGE, {
            player: client.player,
            content: message.content
        })
    }

    isPlaying(client) {
        return this.clientsPlaying.filter(c => c === client).length === 1
    }

    handleAnswer(client, answerId) {
        if (!this.isPlaying(client)) {
            console.log('received answer from unknow player')
            return
        }
        this.currentAnswers.push({
            playerId: client.player.id,
            answerId: answerId
        })
    }

    handlePlayerJoin(client) {
        client.player = null
        this.clients.push(client)
        this.sendConnectedPlayers(client)
        this.sendGameState(client)
        this.sendGamePlayerList(client)
    }

    handlePlayerLeave(client) {
        this.clients = this.clients.filter(c => c !== client)
        this.clientsPlaying = this.clientsPlaying.filter(c => c !== client)
        if (client.player !== null) {
            this.broadcast(net.SMSG_PLAYER_LEAVE, {
                player: client.player
            })
        }
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

    waitingPlayers() {
        var realPlayers = this.clients.filter(c => c.player !== null)
        if (realPlayers.length >= MIN_PLAYERS_TO_PLAY) {
            this.setTimer(TIME_BEFORE_GAME_START, GAMESTATE_GAME_START, function() {})
            this.goToGameState(GAMESTATE_TIMER)
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
        this.questions = this.baseQuestions
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
        console.log("nombre de question " + maxIndex )
        var questionIndex = Math.floor(Math.random() * maxIndex)
        this.currentQuestion = this.questions[questionIndex]
        this.questions.splice(questionIndex, 1)
    }

    computeAnswerTimeout() {
        var timeout = TIME_PER_QUESTION * this.currentQuestion.getTimeoutFactor()
        console.log('question timeout: ' + timeout)
        return timeout
    }

    turnBegin() {
        this.broadcastGamePlayersList()
        this.resetTurn()
        this.selectRandomQuestion()
        var timeout = this.computeAnswerTimeout()
        this.broadcast(net.SMSG_GAME_QUESTION, {
            timeout: timeout,
            question: this.currentQuestion
        })
        this.setTimer(timeout + TIMEOUT_EPSILON * this.clientsPlaying.length, GAMESTATE_TURN_END, function() {})
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
        var playerThatAnswered = []
        var wrongAnswers = 0
        var alivePlayers = this.clientsPlaying.filter(c => !c.player.dead)

        for (var i = 0; i < this.currentAnswers.length; i++) {
            var answer = this.currentAnswers[i]
            var client = alivePlayers.find(c => c.player.id === answer.playerId)
            if (client !== undefined) {
                playerThatAnswered.push(client)
                if (answer.answerId === 0) {
                    if (bonus) {
                        bonus = false
                        client.player.life++
                    }
                } else {
                    client.player.life--
                        wrongAnswers++
                }
            }
        }

        for (var i = 0; i < alivePlayers.length; i++) {
            var client = alivePlayers[i]
            if (playerThatAnswered.filter(c => c === client).length === 0) {
                client.player.life--
                    wrongAnswers++
            }
        }

        if (wrongAnswers === alivePlayers.length) {
            for (var i = 0; i < alivePlayers.length; i++) {
                var client = alivePlayers[i]
                client.player.life++
            }
        }

        for (var i = 0; i < alivePlayers.length; i++) {
            var client = alivePlayers[i]
            if (client.player.life === 0)
                client.player.dead = true
        }
    }

    turnEnd() {
        this.computePlayersScore()
        this.broadcastGamePlayersList()
        var alivePlayers = this.clientsPlaying.filter(client => client.player.life > 0)
        if (alivePlayers.length > 1) {
            this.setTimer(TIME_BETWEEN_TURN, GAMESTATE_TURN_BEGIN, function() {})
            this.goToGameState(GAMESTATE_TIMER)
        } else {
            this.setTimer(TIME_BETWEEN_TURN, GAMESTATE_GAME_END, function() {})
            this.goToGameState(GAMESTATE_TIMER)
        }
    }

    gameEnd() {
        console.log('game ended')
        this.setTimer(TIME_END_GAME, GAMESTATE_PLAYERS_WAITING, function() {})
        this.goToGameState(GAMESTATE_TIMER)
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