var ConnectForm = React.createClass({

    getInitialState() {
        return { name: '' };
    },

    onNicknameChange(e) {
        this.setState({ name: e.target.value });
    },

    startConnection(e) {
        e.preventDefault();
        var socket = io();
        socket.emit('client.nickname', {
            nickname: this.state.name
        });
    },

    render() {
        return React.createElement(
            'div',
            { className: 'container' },
            React.createElement(
                'div',
                { className: 'row' },
                React.createElement(
                    'div',
                    { className: 'col-md-5 centered-form' },
                    React.createElement(
                        'div',
                        { className: 'form-login' },
                        React.createElement(
                            'form',
                            { className: 'wrapper', onSubmit: this.startConnection },
                            React.createElement('input', { className: 'form-control input-sm chat-input', type: 'text', onChange: this.onNicknameChange, placeholder: 'Enter nickname', id: 'nickname' }),
                            React.createElement('br', null),
                            React.createElement('input', { className: 'btn btn-primary btn-md', type: 'submit', value: 'Connect' })
                        )
                    )
                )
            )
        );
    }
});

ReactDOM.render(React.createElement(ConnectForm, null), document.getElementById('react-app'));