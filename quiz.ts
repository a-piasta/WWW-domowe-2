let quiz = [];

quiz[0] = `{
    "introText" : "<h1>Quiz arytmetyczny</h1><p>W tym quizie musisz odpowiedzieć na kilka pytań. Odpowiedź na każde z nich jest dodatnią liczbą całkowitą. Twój wynik to czas poświęcony na rozwiązywanie quizu, powiększony o sumę karnych sekund za złe odpowiedzi (każde pytanie ma przypisaną odpowiednią liczbę). Powodzenia!</p>",
    "questions" : [
        {
            "question" : "2 + 2 = ?",
            "answer" : "4",
            "penalty": 1
        },
        {
            "question" : "2 + 3 = ?",
            "answer" : "4",
            "penalty": 1
        },
        {
            "question" : "2 + 4 = ?",
            "answer" : "5",
            "penalty": 1
        },
        {
            "question" : "2 + 5 = ?",
            "answer" : "7",
            "penalty": 1
        }
    ]
}`;

quiz[1] = `{
    "introText" : "kocham anime",
    "questions" : [
        {
            "question" : "ile sezonów ma Toaru Majutsu no Index?",
            "answer" : "3",
            "penalty" : 2137
        },
        {
            "question" : "ile waży (w kg) Kosaki Onodera?",
            "answer" : "43",
            "penalty" : 1111
        },
        {
            "question" : "z ilu członków składa się Ryuuguu Komachi w idolm@sterze?",
            "answer" : "3",
            "penalty" : 123
        }
    ]
}`;

quiz[2] = `{
    "introText" : "OSU",
    "questions" : [
        {
            "question" : "w którym roku powstało osu?",
            "answer" : "2007",
            "penalty" : 2007
        },
        {
            "question" : "ile pp dostał Azer za najlepszy HDHR score wszech czasów?",
            "answer" : "485",
            "penalty" : 485
        },
        {
            "question" : "ile wynosi max kombo na dużym czarnym",
            "answer" : "1337",
            "penalty" : 1337
        }
    ]
}`;

/*interface IQuestion {
    question: string;
    answer: string;
    penalty: number;
}

interface IQuiz {
    introText: string;
    questions: IQuestion[];
}*/

module.exports = quiz;

/*let quizObject: IQuiz[] = [];
quizObject[0] = JSON.parse(quiz1);
quizObject[1] = JSON.parse(quiz2);
quizObject[2] = JSON.parse(quiz3);
*/