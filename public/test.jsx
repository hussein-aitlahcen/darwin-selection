class Quiz extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            shuffledAnswers: shuffle(props.currentQuestion.question.answers),
            answered: false,
            answer: null,
            currentGameState: 0
        };

        this.handleClick = this.handleClick.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.currentQuestion.question.id !== nextProps.currentQuestion.question.id) {
            nextProps.currentQuestion.question.answers.forEach(function (answer) {
                answer.color = "secondary";
            }, this);
            this.setState({
                shuffledAnswers: shuffle(nextProps.currentQuestion.question.answers),
                answered: false
            })
        }
        if (this.props.currentGameState !== nextProps.currentGameState) {
            if (nextProps.currentGameState === GAMESTATE_TURN_END) {
                if (this.state.shuffledAnswers.length !== 0) {
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
                }
            }
        }
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
            <div>
                <h3>{this.props.currentQuestion.question.description}</h3>
                {
                    this.state.shuffledAnswers.map(function (answer, i) {
                        return <button className={"btn btn-" + answer.color} disabled={that.state.answered} onClick={() => that.handleClick(answer)} key={"answer_" + answer.id}>{answer.description}</button>;
                    })
                }
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
            <div className='userList'>
                {
                    <ul>
                        {this.props.playersList.map(function (user, i) {
                            return <li key={user.life + "_" + i}>{user.id} {user.nickname} {user.life}</li>;
                        })
                        }
                    </ul>
                }
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
                        <div className='form-login'>
                            <form className='wrapper' onSubmit={this.startConnection}>
                                <input className='form-control input-sm chat-input' type='text' onChange={this.onNicknameChange} placeholder='Enter nickname' id='nickname' />
                                <br />
                                <input className='btn btn-primary btn-md' type='submit' value='Connect' />
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
            <li>
                <i>
                    {this.props.player.nickname + " " + this.props.content}
                </i>
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
            <li>
                {this.props.date + " "}<b>{this.props.player.nickname}</b>{"#" + this.props.player.id + " "} : {" " + this.props.content}
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
            messages: []
        };
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

    sendMessage(content) {
        socket.emit(CMSG_CHAT_MESSAGE, {
            content: content
        });
    }

    render() {
        return (
            <ul>
                {
                    this.state.messages.map(function (message, i) {
                        switch (message.type) {
                            case MESSAGE_PLAYER:
                                return <PlayerMessage key={i + "_" + message.date} player={message.player} content={message.content} />
                            case MESSAGE_SYSTEM:
                                return <SystemMessage key={i} player={message.player} content={message.content} />
                        }
                    })
                }
            </ul>
        )
    }
}

class DarwinSelection extends React.Component {

    constructor() {
        super();
        this.state = {
            currentQuestion: {
                timeout: 10,
                question: {
                    description: '',
                    answers: [{
                        description: ''
                    }]
                }
            },
            connectedList: [],
            playerList: [],
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
            playersList: data.players
        });
    }

    _updateConnectionState(data) {
        var { userId, userNickname, userLife } = data;
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
        this.setState({
            gameState: data.state
        });
    }

    _updateGameQuestion(data) {
        var question = data;
        this.setState({
            currentQuestion: question
        });

        console.log('_updateGameQuestion : ' + JSON.stringify(this.state.currentQuestion));
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
                <div>
                    <Quiz currentGameState={this.state.gameState} currentQuestion={this.state.currentQuestion} />
                    <UserList playersList={this.state.playersList} />
                    <Chat />
                </div>
            );
        }
    }

}

ReactDOM.render(<DarwinSelection />, document.getElementById('react-app'));

