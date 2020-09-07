import { setTokenSourceMapRange } from "typescript";

const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const csrfProtection = csrf({cookie: true});

const createError = require('http-errors');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const DatabaseWrapper = require('../db');
const db = new DatabaseWrapper();

const bodyParser = require('body-parser');
const parseForm = bodyParser.urlencoded({extended: false});

const Hasher = require('../auth');
const { request } = require('express');
const hasher = new Hasher();

// Authentication middleware initialization.
passport.use(new LocalStrategy(
  {usernameField: 'login', passwordField: 'pass'},
  function (username, password, done) {
      db.getUserByName(username).then(user => {
          if (!user) {
              return done(null, false);
          }
          hasher.comparePass(password, user.pass).then(good => {
              return done(null, good ? user : false);
          }).catch(err => {
              return done(err);
          })
      }).catch(err => {
          return done(err);
      });
  }));

// Authentication middleware for protected routes.
async function requireAuth(req, res, next) {
  if (!req.user) return res.redirect('/login');
  let token = (await db.getUserByName(req.user.login)).token;
  if (req.cookies.token != token) return res.redirect('/login');
  return req.isAuthenticated() ? next() : res.redirect('/login');
}

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
  const user = await db.getUserById(id);
  return done(null, user || false);
});

router.use(function(req, res, next) {
  res.locals.username = req.user ? req.user.login : null;
  res.cookie('token', req.cookies.token);
  next();
});

/* GET home page. */
router.get('/', csrfProtection, function(req, res) {
  res.render('index', {
    csrfToken: req.csrfToken()
  });
});

router.get('/login', csrfProtection, function(req, res) {
  res.render('login', {
    title: 'Logowanie',
    actionTitle: 'Zaloguj się',
    actionType: 'login',
    redirect: '/login',
    csrfToken: req.csrfToken()
  })
});

router.get('/register', csrfProtection, function(req, res) {
  res.render('login', {
    title: 'Rejestracja',
    actionTitle: 'Zarejestruj się',
    actionType: 'register',
    redirect: '/register',
    csrfToken: req.csrfToken()
  })
});

router.get('/change_password', requireAuth, csrfProtection, function(req, res) {
  res.render('login', {
    title: 'Zmiana hasła',
    actionTitle: 'Zmień hasło',
    actionType: 'changePassword',
    redirect: '/change_password',
    csrfToken: req.csrfToken()
  })
});

router.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

router.post('/register', parseForm, csrfProtection, async function(req, res, next) {
  const username = req.body.login;
  const userExists = await db.getUserByName(username);
  if (userExists) return next(createError(422, 'username busy'));
  const pass1 = req.body.pass1;
  const pass2 = req.body.pass2;
  if (pass1 != pass2) return next(createError(422, 'passwords do not match'));

  try {
    const passHash = await hasher.generateHash(req.body.pass1);
    await db.addNewUser(username, passHash);
  } catch (err) {
    return next(createError(500, err));
  }
  return res.redirect('/login');
});

router.post('/login', parseForm, csrfProtection,
  passport.authenticate(
    'local',
    { session: true, failureRedirect: '/login' } 
  ), async function(req, res) {
    let user = await db.getUserByName(req.body.login);
    res.cookie('token', user.token);
    res.redirect('/');
  }
);

router.post('/change_password', parseForm, csrfProtection,
  passport.authenticate(
    'local',
    { session: true, failureRedirect: '/login' }
  ), async function(req, res, next) {
    const username = req.user.login;
    const userDBRow = await db.getUserByName(username);
    if (!userDBRow) return next(createError(409, 'user does not exist'));

    const pass1 = req.body.pass1;
    const pass2 = req.body.pass2;
    if (pass1 != pass2) return next(createError(422, 'passwords do not match'));

    try {
      const passHash = await hasher.generateHash(pass1);
      await db.changePassword(username, passHash);
      return res.redirect('/logout');
    } catch (err) {
      return next(createError(500, err));
    }
  }
);

router.get('/choose_quiz', parseForm, requireAuth, csrfProtection,
  async function(req, res, next) {
    try {
      let quizList = await db.getAllQuizzes();

      res.render('choose_quiz', {
        quizList: quizList,
        csrfToken: req.csrfToken()
      });
    } catch (err) {
      return next(createError(500, err));
    }
  }
);

router.get('/quiz/:quizId', requireAuth, csrfProtection,
  async function(req, res, next) {
    try {
      let allScores = await db.getTopScores(req.params.quizId);
      let mySolution;
      allScores.forEach(score => {
        if (score.login == req.user.login) mySolution = JSON.parse(score.resultstring);
      });
      let topScores = [];

      for (let i = 0; i < allScores.length && i < 5; ++i) {
        topScores[i] = {
          login: allScores[i].login,
          result: allScores[i].result
        };
      }
      let statistics = undefined, raport = undefined;
      if (mySolution) {
        statistics = [];
        for (let i = 0; i < mySolution.answer.length; ++i) {
          statistics[i] = (await db.getQuestionStatistics(i, req.params.quizId))['AVG(time)'];
        }
        let quiz = await db.getQuizById(req.params.quizId);
        let quizObject = JSON.parse(quiz.quizstring);
        raport = [];
        for (let i = 0; i < quizObject.questions.length; ++i) {
          raport[i] = {
            question: quizObject.questions[i].question,
            yourAnswer: mySolution.answer[i],
            correctAnswer: quizObject.questions[i].answer,
            penalty: quizObject.questions[i].penalty
          };
        }
      }

      res.render('quiz', {
        quizId: req.params.quizId,
        topScores: topScores,
        raport: raport,
        statistics: statistics,
        csrfToken: req.csrfToken()
      });
    } catch (err) {
      return next(createError(500, err));
    }
  }
);

router.post('/solve/:quizId', requireAuth, csrfProtection,
  function(req, res) {
    res.render('solving', {
      quizId: req.params.quizId,
      csrfToken: req.csrfToken()
    });
  }
);

router.get('/api/:quizId', requireAuth, csrfProtection,
  async function(req, res, next) {
    try {
      let questions = await db.getQuizById(req.params.quizId);
      await db.startQuiz(req.user.login, req.params.quizId);
      return res.json(questions.quizstring);
    } catch (err) {
      console.log(err);
      next(createError(500, err));
    }
  }
);

router.post('/submit/:quizId', requireAuth, csrfProtection,
  async function(req, res, next) {
    try {
      let resultObject = JSON.parse(req.body.resultJSON);
      let now = (new Date()).getTime();
      let start = await db.whenStarted(req.user.login, req.params.quizId);
      if (start === null) {
        return next(createError(500, 'wtf happened'));
      }

      if (resultObject.answer && resultObject.timeArray) {
        let quiz = await db.getQuizById(req.params.quizId);
        let questions = JSON.parse(quiz.quizstring).questions;
        let result = 0.0, penalty = 0.0;
        if (resultObject.answer.length != questions.length || resultObject.timeArray.length != questions.length)
          return next(createError(422), 'incorrect response from client');
        let totalTime = (now - start._when) / 1000;

        for (let i = 0; i < questions.length; ++i) {
          if (questions[i].answer != resultObject.answer[i]) penalty += questions[i].penalty;
          resultObject.timeArray[i] *= totalTime;
          await db.addSolution(i, req.params.quizId, resultObject.timeArray[i]);
        }

        result = totalTime + penalty;
        await db.addScore(req.params.quizId, req.user.login, result, JSON.stringify(resultObject));
        res.redirect('/quiz/' + req.params.quizId);
      } else {
        return next(createError(422, 'incorrect response from client'));
      }
    } catch (err) {
      return next(createError(500, err));
    }
  }
);

module.exports = router;
