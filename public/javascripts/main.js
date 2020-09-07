var intro = document.querySelector("div.intro");
var beforeQuiz = document.querySelector("div.before-quiz");
var question = document.querySelector("div.question");
var finishButton = document.querySelector("button.button-finish");
var questionNumberWrapper = document.querySelector("div.question-number-wrapper");
var penaltyWrapper = document.querySelector("div.penalty-wrapper");
var timerWrapper = document.querySelector("div.timer-wrapper");
var result;
var questionNumber;
var questionsNumber;
var answers;
var answeredQuestions;
var usedTime;
var wholeTime;
var quizObject;

(async function() {
let quizId = window.location.pathname.split("/").pop();
let quizString = '';
let request = async () => {
    const response = await fetch('/api/' + quizId);
    const data = await response.json();
    quizString = data;
}
await request();
quizObject = JSON.parse(quizString);
startQuiz();
intro.innerHTML = quizObject.introText;
})();


setInterval(timer, 100);
function startQuiz() {
    answeredQuestions = 0;
    answers = [];
    usedTime = [];
    wholeTime = 0;
    questionNumber = 0;
    questionsNumber = quizObject.questions.length;
    displayQuestion(questionNumber);
}
function timer() {
    if (questionNumber != -1) {
        if (!usedTime[questionNumber])
            usedTime[questionNumber] = 0;
        usedTime[questionNumber] += 1;
        wholeTime += 1;
        timerWrapper.innerText = 'Spędzony czas: ' + Math.floor(wholeTime / 10) + '.' + (wholeTime % 10) + ' sekund.';
    }
}
function displayQuestion(nr) {
    questionNumber = nr;
    question.innerHTML = quizObject.questions[nr].question;
    if (answeredQuestions == questionsNumber)
        finishButton.style.display = '';
    else
        finishButton.style.display = 'none';
    questionNumberWrapper.innerText = 'Pytanie nr: ' + (nr + 1);
    penaltyWrapper.innerText = 'Kara za złą odpowiedź: ' + quizObject.questions[nr].penalty;
}
function previousQuestion() {
    var answer = document.getElementById("answer");
    if (!answers[questionNumber])
        answeredQuestions++;
    answers[questionNumber] = answer.value;
    if (!answers[questionNumber])
        answeredQuestions--;
    if (questionNumber > 0) {
        questionNumber--;
        if (answers[questionNumber])
            answer.value = answers[questionNumber];
        else
            answer.value = '';
    }
    displayQuestion(questionNumber);
}
function nextQuestion() {
    var answer = document.getElementById("answer");
    if (!answers[questionNumber])
        answeredQuestions++;
    answers[questionNumber] = answer.value;
    if (!answers[questionNumber])
        answeredQuestions--;
    if (questionNumber + 1 < questionsNumber) {
        questionNumber++;
        if (answers[questionNumber])
            answer.value = answers[questionNumber];
        else
            answer.value = '';
    }
    displayQuestion(questionNumber);
}
function finishQuiz() {
    for (let i = 0; i < questionsNumber; ++i) {
        usedTime[i] /= wholeTime;
    }
    let result = {
        answer: answers,
        timeArray: usedTime
    };
    let JSONinput = document.querySelector('input[name="resultJSON"]');
    JSONinput.value = JSON.stringify(result);
    document.getElementById('submit-quiz').submit();
}