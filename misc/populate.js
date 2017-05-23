var conn = new Mongo()
var db = conn.getDB('darwin')

db.createCollection('questions')
db.question.remove({})

var questionId = 0

var content = cat('output/openquizz.csv')
var lines = content.split('\n')
for (var i = 0; i < lines.length; i++) {
    var line = lines[i]
    var entries = line.split(';')
    var description = entries[1]
    var answers = [{
            id: 0,
            description: entries[2]
        },
        {
            id: 1,
            description: entries[3]
        },
        {
            id: 2,
            description: entries[4]
        },
        {
            id: 3,
            description: entries[5]
        }
    ]
    var difficulty = entries[6]
    var anecdote = entries[7]
    var wiki = entries[8]

    db.questions.insert({
        id: questionId++,
        description: description,
        anecdote: anecdote,
        difficulty: difficulty,
        wiki: wiki,
        answers: answers
    })
}