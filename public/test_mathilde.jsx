console.log('coucou');

var MyComponentClass = React.createClass({  
  render: function () {
    return <h1>Hello world</h1>;
  }
});

var Quiz = React.createClass({
  getInitialState() {
        return {question : {
          description: '',
          answers: [{
            description: ''
          }]
        }};
    },  
    render() {
      console.log(this.state.question.answers);
      return (
        <div>
          <h3>{this.state.question.description}</h3>    
          <p>{this.state.question.answers[0].description}</p>
          {this.state.question.answers.map(function(answer, i) { 
            
              return <p key={"answer_"+i}>{answer.description}</p>;
            })} 
        </div>
      );
    },

    componentDidMount() {
      var that = this;
      socket.on(SMSG_GAME_QUESTION, function(message) {
      var question = message.question;
      that.setState({question : question});
      console.log(message);
      console.log(message.question);
});
    }
})

ReactDOM.render(<MyComponentClass />, document.getElementById('react-app'));


socket.emit(CMSG_NICKNAME, {
  nickname: 'mathilde' 
});

socket.on(SMSG_GAME_STATE_UPDATE, function(message) {
  console.log('gamestate -> ' + message.state);
})

 ReactDOM.render(<Quiz />, document.getElementById('quiz-app'));
socket.on('error', console.error.bind(console));
