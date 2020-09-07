const util = require('util');
const sqlite3 = require('sqlite3').verbose();
const {DB_PATH} = require('./config');

class DatabaseWrapper {
    constructor() {
        this.init = new Promise(((resolve, reject) => {
            this._db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) console.error(err);

                this._promisifiedRun('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT, pass TEXT, token INTEGER NOT NULL);')
                    .then(() => this._promisifiedRun('CREATE TABLE IF NOT EXISTS quiz (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, quizstring TEXT);'))
                    .then(() => this._promisifiedRun(`CREATE TABLE IF NOT EXISTS scores (quiz_id INTEGER NOT NULL, login TEXT, result REAL NOT NULL, resultstring TEXT,
                                FOREIGN KEY (quiz_id) REFERENCES quiz (id));`))
                    .then(() => this._promisifiedRun(`CREATE TABLE IF NOT EXISTS started(login TEXT NOT NULL, quiz_id INTEGER NOT NULL, _when INTEGER NOT NULL);`))
                    .then(() => this._promisifiedRun(`CREATE TABLE IF NOT EXISTS questions (quiz_id INTEGER NOT NULL, question_id INTEGER NOT NULL, time REAL NOT NULL);`))
                    .then(resolve).catch(reject);
            });
        }));
    }

    _promisifiedDbFun(fun) {
        return (stmt, paramsValues) =>
            util.promisify(fun).bind(this._db)(stmt, paramsValues);
    }

    _promisifiedRun(stmt, paramsValues=[]) {
        return this._promisifiedDbFun(this._db.run)(stmt, paramsValues);
    }

    _promisifiedGet(stmt, paramsValues=[]) {
        return this._promisifiedDbFun(this._db.get)(stmt, paramsValues);
    }

    _promisifiedAll(stmt, paramsValues=[]) {
        return this._promisifiedDbFun(this._db.all)(stmt, paramsValues);
    }

    addNewUser(username, pass) {
        const stmt = 'INSERT INTO users (login, pass, token) VALUES (?, ?, ?)';
        return this._promisifiedRun(stmt, [username, pass, Math.floor(Math.random() * 30000)]);
    }

    getUserByName(username) {
        const stmt = 'SELECT * FROM users WHERE login=?';
        return this._promisifiedGet(stmt, [username]);
    }

    changePassword(username, pass) {
        const stmt = 'UPDATE users SET pass=?, token=? WHERE login=?';
        return this._promisifiedRun(stmt, [pass, Math.floor(Math.random() * 30000), username]);
    }

    getUserById(id) {
        const stmt = 'SELECT * FROM users WHERE id=?';
        return this._promisifiedGet(stmt, [id]);
    }

    addQuiz(name, quizString) {
        const stmt = `INSERT INTO quiz (name, quizstring) VALUES (?, ?)`;
        return this._promisifiedRun(stmt, [name, quizString]);
    }

    startQuiz(username, quizId) {
        const date = new Date();
        const now = date.getTime();
        const stmt = `INSERT INTO started (login, quiz_id, _when) VALUES (?, ?, ?)`;
        return this._promisifiedRun(stmt, [username, quizId, now]);
    }

    whenStarted(username, quizId) {
        const stmt = 'SELECT _when FROM started WHERE login=? AND quiz_id=? ORDER BY _when ASC';
        return this._promisifiedGet(stmt, [username, quizId]);
    }

    getAllQuizzes() {
        const stmt = "SELECT id, name FROM quiz";
        return this._promisifiedAll(stmt);
    }

    getQuizById(id) {
        const stmt = 'SELECT * from quiz WHERE id=?';
        return this._promisifiedGet(stmt, [id]);
    }

    addScore(quiz_id, username, result, resultstring) {
        const stmt = 'INSERT INTO scores (quiz_id, login, result, resultstring) VALUES (?, ?, ?, ?)';
        return this._promisifiedRun(stmt, [quiz_id, username, result, resultstring]);
    }

    getTopScores(quiz_id) {
        const stmt = 'SELECT * FROM scores WHERE quiz_id=? ORDER BY result ASC';
        return this._promisifiedAll(stmt, [quiz_id]);
    }

    addSolution(question_id, quiz_id, time) {
        const stmt = `INSERT INTO questions (quiz_id, question_id, time) VALUES (?, ?, ?)`;
        return this._promisifiedRun(stmt, [quiz_id, question_id, time]);
    }

    getQuestionStatistics(question_id, quiz_id) {
        const stmt = `SELECT AVG(time) FROM questions WHERE question_id=? AND quiz_id=?`;
        return this._promisifiedGet(stmt, [question_id, quiz_id]);
    }
}


module.exports = DatabaseWrapper;
