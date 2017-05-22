var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/darwin');

var answerSchema = mongoose.Schema({
    id: Number,
    description: String
});

var questionSchema = mongoose.Schema({
    id: Number,
    description: String,
    anecdote: String,
    difficulty: Number,
    wiki: String,
    answers: [answerSchema]
});

module.exports.Answer = mongoose.model('Answer', answerSchema);
module.exports.Question = mongoose.model('Question', questionSchema);
module.exports.connection = mongoose.connection;