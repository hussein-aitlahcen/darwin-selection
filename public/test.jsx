var connected = false;

var QuizzFrame = React.createClass({
    
    render() {
        return (<div></div>
        );
    }

});

var UserList = React.createClass({

    updateUserList(){
        
    },

    render() {
        return (<div></div>

        );
    }

});

var LobbyInfo = React.createClass({
    render() {
        return (<div></div>    
        );
    }

});

var ConnectForm = React.createClass({

    getInitialState() {
        return {name : ''};
    },

    onNicknameChange(e) {
        this.setState({name : e.target.value});
    },

    startConnection(e) {
        e.preventDefault();

        //Messages dans net.jsx
        socket.emit(CMSG_NICKNAME, {
            nickname: this.state.name
        });

        console.log("Sent message"+CMSG_NICKNAME+" "+this.state.name);
    },  

    render() {
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-5 centered-form">
                        <div className='form-login'>
                            <form className='wrapper' onSubmit={this.startConnection}>
                                <input className='form-control input-sm chat-input' type='text' onChange={this.onNicknameChange} placeholder='Enter nickname' id='nickname'/>
                                <br />
                                <input className='btn btn-primary btn-md' type='submit' value='Connect'/>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});


var DarwinSelection = React.createClass({

    getInitialState() {
         return {players : [], nickname :''};
      },

    componentDidMount() {
        socket.on(SMSG_PLAYERS_LIST,this._updatePlayerList);
        socket.on(SMSG_NICKNAME_ACK,this._updateConnectionState);
        socket.on(SMSG_GAME_STATE_UPDATE,this._updateGameState);
        socket.on(SMSG_GAME_QUESTION,this._updateGameQuestion);
        socket.on(SMSG_PLAYERS_SCORE,this._updatePlayerScore);
    },

    _updatePlayerList(data){
        var players = data;
        console.log('_updatePlayerList : '+JSON.stringify(players));
        this.setState({players});
    },

    _updateConnectionState(data){
        var {id, nickname, life} = data;
        console.log('_updateConnectionState : '+JSON.stringify({id,nickname,life}));
        this.setState({id, nickname, life})
    },

    _updateGameState(data){
        var gameState = data;
        console.log('_updateGameState : '+JSON.stringify(gameState));
        this.setState({gameState});
    },

    _updateGameQuestion(data){
        var currentQuestion = data;
        console.log('_updateGameQuestion : '+JSON.stringify(currentQuestion));
        this.setState({currentQuestion});   
    },

    _updatePlayerScore(data){

    },

    render() {
        if(this.state.nickname=='')
        {
            return (
            <div>
                <ConnectForm />
            </div>    
            );
        }
        else
        {
            return (
            <div>
                <UserList />
            </div>
            );
        }
    }

});

ReactDOM.render(<DarwinSelection />,document.getElementById('react-app'));
    
