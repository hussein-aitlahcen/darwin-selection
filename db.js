var mongoose = require('mongoose')

mongoose.connect('mongodb://localhost/darwin')

var answerSchema = mongoose.Schema({
    id: Number,
    description: String
})

var questionSchema = mongoose.Schema({
    id: Number,
    description: String,
    anecdote: String,
    difficulty: String,
    wiki: String,
    answers: [answerSchema]
})

questionSchema.methods.getTimeoutFactor = function() {
    switch (this.difficulty) {
        case 'Débutant':
            return 1

        case 'Confirmé':
            return 1.2

        case 'Expert':
            return 1.5
    }
    return 1;
}

module.exports.Question = mongoose.model('Question', questionSchema)
module.exports.connection = mongoose.connection