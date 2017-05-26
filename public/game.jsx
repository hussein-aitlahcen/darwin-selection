class Quiz extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            shuffledAnswers: shuffle(props.currentQuestion.question.answers),
            answered: false,
            answer: null,
            timeBase: 0,
            timeLeft: 0,
            progressPercent: 100,
            progressStyle: {
                width: "100%"
            }
        };
        this.handleClick = this.handleClick.bind(this);
        this.handleTimeoutTick = this.handleTimeoutTick.bind(this);
    }

    componentWillUnmount() {
        clearInterval(this.timer);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.currentGameState === GAMESTATE_GAME_END) {
            nextProps.currentQuestion.timeout = null;
        }
        if (this.props.currentQuestion.question.id !== nextProps.currentQuestion.question.id) {
            nextProps.currentQuestion.question.answers.forEach(function (answer) {
                answer.color = "secondary";
            }, this);
            this.setState({
                shuffledAnswers: shuffle(nextProps.currentQuestion.question.answers),
                answered: false
            })
            this.timer = setInterval(this.handleTimeoutTick, 200);
            this.setState({
                timeBase: nextProps.currentQuestion.timeout,
                timeLeft: nextProps.currentQuestion.timeout,
                progressPercent: 100,
                progressStyle: {
                    width: "100%"
                }
            });
        }
        if (this.props.currentGameState !== nextProps.currentGameState) {
            switch (nextProps.currentGameState) {
                case GAMESTATE_TURN_BEGIN:
                    // on demarre le timer
                    break;

                case GAMESTATE_TURN_END:
                    // on stop le timer
                    if (this.timer !== null) {
                        clearInterval(this.timer);
                    }
                    let goodAnswer = this.state.shuffledAnswers.find((a) => a.id === 0);
                    if (goodAnswer !== undefined) {
                        goodAnswer.color = "success";
                        if (this.state.answered) {
                            if (this.state.answer.id !== 0) {
                                this.state.answer.color = "danger";
                            }
                        }
                        this.setState({
                            answered: true,
                            shuffledAnswers: this.state.shuffledAnswers
                        });
                    }
                    break;
            }
        }
    }

    handleTimeoutTick() {
        var newTimeLeft = Math.max(0, this.state.timeLeft - 0.2);
        var progressPercent = Math.floor(this.state.timeLeft * 100 / this.state.timeBase);
        var answered = this.state.answered || progressPercent === 0;
        this.setState({
            answered: answered,
            timeLeft: newTimeLeft,
            progressPercent: progressPercent,
            progressStyle: {
                width: progressPercent + "%"
            }
        });
    }

    handleClick(userAnswer) {
        userAnswer.color = "warning";
        this.setState({
            answered: true,
            answer: userAnswer
        });
        socket.emit(CMSG_GAME_ANSWER, {
            answerId: userAnswer.id
        });
    }

    render() {
        var that = this;
        return (
            <div className="col col-md-7 text-center quiz">
                <div className="card">
                    <div className="card-block">
                        <div className="row">
                            <div className="container">
                                {
                                    this.props.currentGameState == GAMESTATE_TIMER && this.props.previousGameState == GAMESTATE_GAME_END &&
                                    <div>
                                        <h2>
                                            <span className="chat-message-nick-bold">
                                                {this.props.winner.nickname}
                                            </span>
                                            <span className="chat-message-id opacity-50">
                                                {"#" + this.props.winner.id}
                                            </span>{" est le vainqueur"}
                                        </h2>
                                        <span>{MSG_GAME_END}</span>
                                    </div>
                                    || this.props.currentGameState == GAMESTATE_PLAYERS_WAITING &&
                                    <div>
                                        <i className="fa fa-spinner fa-spin fa-3x fa-fw"></i>
                                        <span>{MSG_PLAYERS_WAITING}</span>
                                    </div>
                                    || this.props.currentQuestion.timeout == null &&
                                    <div>
                                        <i className="fa fa-spinner fa-spin fa-3x fa-fw"></i>
                                        <span>{MSG_NO_QUESTION}</span>
                                    </div>
                                    || this.props.currentQuestion != null &&
                                    <div>
                                        <div className="col col-md-12 question-description">
                                            {this.props.currentQuestion.question.description}
                                        </div>
                                        <div className="row">
                                            {
                                                this.state.shuffledAnswers.map(function (answer, i) {
                                                    return (
                                                        <div key={"answer_" + answer.id} className="col col-md-6">
                                                            <button className={"answer btn btn-lg btn-" + answer.color} type="button" disabled={that.state.answered || !that.props.isPlaying || that.props.isDead} onClick={() => that.handleClick(answer)}>
                                                                {answer.description}
                                                            </button>
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                        <div className="row">
                                            <div className="col col-md-12">
                                                <progress className="timeout-progress" min="0" max="100" value={this.state.progressPercent}></progress>
                                            </div>
                                        </div>
                                        <div className="col col-md-12 anecdote">
                                            {this.state.answered &&
                                                <p>
                                                    <a href={this.props.currentQuestion.question.wiki} target="_blank">
                                                        <i className="fa fa-quote-left"></i>
                                                        {" " + this.props.currentQuestion.question.anecdote + " "}
                                                        <i className="fa fa-quote-right"></i>
                                                    </a>
                                                </p>
                                            }
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

class UserList extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="user-list col col-md-2">
                <ul className="list-group">
                    {
                        this.props.playersList.map(function (user, i) {
                            return (
                                <li className="list-group-item" key={user.life + "_" + i}>
                                    <span className={
                                        i == 0 && "gold" ||
                                        i == 1 && "silver" ||
                                        i == 2 && "bronze"
                                    }>
                                        <i className="fa fa-user"></i>
                                        <span className="chat-message-nick-bold">
                                            {" " + user.nickname}
                                        </span>
                                        <span className="chat-message-id opacity-50">
                                            {"#" + user.id + " "}
                                        </span>
                                        <span className="badge badge-info badge-pill">
                                            {user.life}
                                        </span>
                                    </span>
                                </li>
                            );
                        })
                    }
                </ul>
            </div>

        );
    }
}

class ConnectForm extends React.Component {

    constructor() {
        super();
        this.state = {
            name: ''
        };

        this.onNicknameChange = this.onNicknameChange.bind(this);
        this.startConnection = this.startConnection.bind(this);
    }

    onNicknameChange(e) {
        this.setState({ name: e.target.value });
    }

    startConnection(e) {
        e.preventDefault();

        //Messages dans net.jsx
        socket.emit(CMSG_NICKNAME, {
            nickname: this.state.name
        });

        console.log("Sent message" + CMSG_NICKNAME + " " + this.state.name);
    }

    render() {
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-5 centered-form">
                        <div className="form-login">
                            <form className="wrapper" onSubmit={this.startConnection}>
                                <input className="form-control input-sm chat-input" type="text" onChange={this.onNicknameChange} placeholder="Votre pseudo" id="nickname" />
                                <br />
                                <input className="btn btn-primary btn-md" type="submit" value="Connexion" />
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

}

class SystemMessage extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <li className="chat-message-system">
                <span className="chat-message-nick">
                    {this.props.player.nickname}
                </span>{" "}
                <span className="chat-message-content">
                    {this.props.content}
                </span>
            </li>
        )
    }
}

class PlayerMessage extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <li className="chat-message-player">
                <span className="chat-message-date opacity-50">
                    {this.props.date}
                </span>{" "}
                <span className="chat-message-nick-bold">
                    {this.props.player.nickname}
                </span>
                <span className="chat-message-id opacity-50">
                    {"#" + this.props.player.id}
                </span>{" : "}
                <span className="chat-message-content">
                    {this.props.content}
                </span>
            </li>
        )
    }
}

let MESSAGE_PLAYER = 0;
let MESSAGE_SYSTEM = 1;

class Chat extends React.Component {

    constructor() {
        super();
        this.state = {
            messages: [],
            input: ''
        };
        this.sendMessage = this.sendMessage.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        socket.on(SMSG_CHAT_MESSAGE, this._updateChatNewMessage.bind(this));
        socket.on(SMSG_PLAYER_JOIN, this._updateChatPlayerJoined.bind(this));
        socket.on(SMSG_PLAYER_LEAVE, this._updateChatPlayerLeft.bind(this));
    }

    addMessage(message) {
        var messages = this.state.messages;
        if (this.state.messages.length > 30) {
            messages.shift();
        }
        messages.push(message);
        this.setState({
            messages: messages
        });
    }

    _updateChatPlayerJoined(data) {
        this.addMessage({
            type: MESSAGE_SYSTEM,
            player: data.player,
            content: "s'est connecté"
        });
    }

    _updateChatPlayerLeft(data) {
        this.addMessage({
            type: MESSAGE_SYSTEM,
            player: data.player,
            content: "s'est déconnecté"
        });
    }

    _updateChatNewMessage(data) {
        this.addMessage({
            type: MESSAGE_PLAYER,
            player: data.player,
            content: data.content,
            date: new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds()
        });
    }

    handleChange(e) {
        this.setState({
            input: e.target.value
        });
    }

    sendMessage(e) {
        e.preventDefault();
        socket.emit(CMSG_CHAT_MESSAGE, {
            content: this.state.input
        });
        this.setState({
            input: ''
        });
    }

    render() {
        return (
            <div className="card">
                <h3 className="card-header">Chat</h3>
                <div className="chat-card card-block">
                    <small>
                        <ul className="chat-messages-list list-unstyled">
                            {
                                this.state.messages.map(function (message, i) {
                                    switch (message.type) {
                                        case MESSAGE_PLAYER:
                                            return <PlayerMessage key={i + "_" + message.date} date={message.date} player={message.player} content={message.content} />
                                        case MESSAGE_SYSTEM:
                                            return <SystemMessage key={i} player={message.player} content={message.content} />
                                    }
                                })
                            }
                        </ul>
                    </small>
                    <div>
                        <form onSubmit={this.sendMessage}>
                            <input onChange={this.handleChange} value={this.state.input} className="form-control" type="text" placeholder="Votre message" />
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}

class DarwinSelection extends React.Component {

    constructor() {
        super();
        this.state = {
            currentQuestion: {
                timeout: null,
                question: {
                    description: '',
                    answers: [{
                        description: ''
                    }]
                }
            },
            currentGameState: 0,
            connectedList: [],
            playersList: [],
            userNickname: '',
            loggedIn: false
        };
    }

    componentDidMount() {
        socket.on(SMSG_PLAYERS_LIST, this._updateConnectedList.bind(this));
        socket.on(SMSG_NICKNAME_ACK, this._updateConnectionState.bind(this));
        socket.on(SMSG_GAME_STATE_UPDATE, this._updateGameState.bind(this));
        socket.on(SMSG_GAME_QUESTION, this._updateGameQuestion.bind(this));
        socket.on(SMSG_GAME_PLAYERS, this._updatePlayerList.bind(this));
        socket.on(SMSG_PLAYER_JOIN, this._updatePlayerJoined.bind(this));
        socket.on(SMSG_PLAYER_LEAVE, this._updatePlayerLeft.bind(this));
    }

    _updateConnectedList(data) {
        console.log('_updateConnectedList : ' + JSON.stringify(data));
        let connectedList = data.players;

        connectedList.forEach(function (user) {
            user.playing = false;
        });

        this.setState({
            connectedList: data.players
        });
    }

    _updatePlayerList(data) {
        console.log('_updatePlayerList : ' + JSON.stringify(data));
        this.setState({
            playersList: data.players.sort(function compare(a, b) {
                if (a.life > b.life)
                    return -1;
                if (a.life < b.life)
                    return 1;
                return 0;
            })
        });
    }

    _updateConnectionState(data) {
        var userId = data.player.id;
        var userLife = data.player.life;
        var userNickname = data.player.name;
        console.log('_updateConnectionState : ' + JSON.stringify({ userId, userNickname, userLife }));
        this.setState({
            userId: userId,
            userNickname: userNickname,
            userLife: userLife,
            loggedIn: true
        })
    }

    _updateGameState(data) {
        console.log('_updateGameState : ' + JSON.stringify(data));
        var previousGameState = this.state.gameState;
        this.setState({
            gameState: data.state,
            previousGameState: previousGameState
        });
    }

    _updateGameQuestion(data) {
        var question = data;
        this.setState({
            currentQuestion: question
        });
    }

    _updatePlayerJoined(data) {
        this.state.connectedList.push(data.player);
        this.setState({ connectedList: this.state.connectedList });
    }

    _updatePlayerLeft(data) {
        let playerId = data.player.id;
        for (var i = 0; i < this.state.connectedList.length; i++) {
            if (playerId === this.state.connectedList[i].id) {
                this.state.connectedList.splice(i, 1);
                break;
            }
        }
        this.setState({ connectedList: this.state.connectedList });
    }

    isPlaying() {
        var that = this;
        var playing = false;
        this.state.playersList.forEach(function (player) {
            if (that.state.userId === player.id) {
                playing = true;
            }
        });
        return playing;
    }

    isDead() {
        var that = this;

        var userPlayer = this.state.playersList.find((u) => u.id === that.state.userId);
        return userPlayer !== undefined && userPlayer.dead;
    }

    getWinner() {
        return this.state.playersList[0];
    }

    render() {
        if (!this.state.loggedIn) {
            return (
                <div>
                    <ConnectForm />
                </div>
            );
        }
        else {
            return (
                <div className="container-fluid">
                    <div className="row">
                        <UserList playersList={this.state.playersList} />
                        {
                            <Quiz isPlaying={this.isPlaying()} previousGameState={this.state.previousGameState} isDead={this.isDead()} winner={this.getWinner()} currentGameState={this.state.gameState} currentQuestion={this.state.currentQuestion} />
                        }
                        <Chat />
                    </div>
                </div>
            );
        }
    }

}

ReactDOM.render(<DarwinSelection />, document.getElementById('react-app'));

