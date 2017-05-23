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

        socket.on()
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
