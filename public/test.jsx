var ConnectForm = React.createClass({

    getInitialState() {
        return {name : ''};
    },

    onNicknameChange(e) {
        this.setState({name : e.target.value});
    },

    startConnection(e) {
        e.preventDefault();
        var socket = io();
        socket.emit('client.nickname', {
            nickname: this.state.name
        });
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
