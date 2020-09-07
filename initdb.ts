const DatabaseWrapper = require('./db');
const db = new DatabaseWrapper();

const Hasher = require('./auth');
const hasher = new Hasher();

function initdb() {
    const quiz = require('./quiz');
    db.addQuiz('arytmetyczny', quiz[0]);
    db.addQuiz('anime', quiz[1]);
    db.addQuiz('Ohio State University', quiz[2]);

    const users = [
        {
            login: 'user1',
            pass: 'user1'
        },
        {
            login: 'user2',
            pass: 'user2'
        }
    ];

    users.forEach(async function(user){
        const passHash = await hasher.generateHash(user.pass);
        await db.addNewUser(user.login, passHash);
    });
}

setTimeout(initdb, 2000);