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
        return (

        );
    }

});

var LobbyInfo = React.createClass({
    render() {
        return (<div></div>    
        );
    }

});


var Game = React.createClass({

    componentDidMount() {
        socket.on('SMSG_PLAYERS_LIST',this._updatePlayerList);
        socket.on('SMSG_ACK_NICKNAME',this._updateView);
    },

    _updatePlayerList(data){
        var players = data;
        this.setState({players});
    },

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

        ReactDOM.render(<Game />, document.getElementById('react-app'));
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

ReactDOM.render(<ConnectForm />,document.getElementById('react-app'));
    
