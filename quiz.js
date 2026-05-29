(() => {

'use strict';

/* =========================
ELEMENTS
========================= */

const chapterScreen =
document.getElementById('chapter-screen');

const quizScreen =
document.getElementById('quiz-screen');

const finishScreen =
document.getElementById('finish-screen');

const chapterButtons =
document.querySelectorAll('.chapter-btn');

const questionText =
document.getElementById('question-text');

const answersContainer =
document.getElementById('answers-container');

const questionCount =
document.getElementById('question-count');

const nextBtn =
document.getElementById('next-btn');

const backBtn =
document.getElementById('back-btn');

const restartBtn =
document.getElementById('restart-btn');

/* ✅ LOGO */
const avatarContainer =
document.querySelector('.avatar-container');

/* =========================
STATE
========================= */

let currentQuestions = [];

let currentIndex = 0;

let answered = false;

/* =========================
SHUFFLE
========================= */

function shuffleArray(array){

for(
let i = array.length - 1;
i > 0;
i--
){

const j =
Math.floor(
Math.random() * (i + 1)
);

[array[i], array[j]] =
[array[j], array[i]];

}

return array;

}

/* =========================
START QUIZ
========================= */

chapterButtons.forEach(button => {

button.addEventListener(
'click',
() => {

const chapter =
button.dataset.chapter;

/* =========================
COPY QUESTIONS
========================= */

currentQuestions =
[...quizData[chapter]];

/* =========================
RANDOM QUESTION ORDER
========================= */

shuffleArray(currentQuestions);

/* =========================
RANDOM ANSWER ORDER
========================= */

currentQuestions.forEach(question => {

const correctAnswer =
question.answers[
question.correct
];

/* answers random */
shuffleArray(question.answers);

/* new correct index */
question.correct =
question.answers.indexOf(
correctAnswer
);

});

currentIndex = 0;

/* ✅ HIDE LOGO */
avatarContainer.style.display =
'none';

chapterScreen.classList.add(
'hidden'
);

finishScreen.classList.add(
'hidden'
);

quizScreen.classList.remove(
'hidden'
);

showQuestion();

});

});

/* =========================
SHOW QUESTION
========================= */

function showQuestion(){

answered = false;

nextBtn.style.display = 'none';

const currentQuestion =
currentQuestions[currentIndex];

questionText.textContent =
currentQuestion.question;

questionCount.textContent =
`${currentIndex + 1} / ${currentQuestions.length}`;

answersContainer.innerHTML = '';

currentQuestion.answers.forEach(
(answer, index) => {

const button =
document.createElement('button');

button.className =
'answer-btn';

button.textContent =
answer;

button.addEventListener(
'click',
() => selectAnswer(button, index)
);

answersContainer.appendChild(button);

});

}

/* =========================
SELECT ANSWER
========================= */

function selectAnswer(button, index){

if(answered) return;

answered = true;

const currentQuestion =
currentQuestions[currentIndex];

const buttons =
document.querySelectorAll('.answer-btn');

buttons.forEach((btn, i) => {

if(i === currentQuestion.correct){

btn.classList.add('correct');

}

if(
i === index &&
i !== currentQuestion.correct
){

btn.classList.add('wrong');

}

});

nextBtn.style.display =
'inline-block';

}

/* =========================
NEXT
========================= */

nextBtn.addEventListener(
'click',
() => {

currentIndex++;

if(
currentIndex >=
currentQuestions.length
){

quizScreen.classList.add(
'hidden'
);

finishScreen.classList.remove(
'hidden'
);

return;

}

showQuestion();

}
);

/* =========================
BACK
========================= */

backBtn.addEventListener(
'click',
() => {

/* ✅ SHOW LOGO */
avatarContainer.style.display =
'flex';

quizScreen.classList.add(
'hidden'
);

finishScreen.classList.add(
'hidden'
);

chapterScreen.classList.remove(
'hidden'
);

}
);

/* =========================
RESTART
========================= */

restartBtn.addEventListener(
'click',
() => {

/* ✅ SHOW LOGO */
avatarContainer.style.display =
'flex';

finishScreen.classList.add(
'hidden'
);

chapterScreen.classList.remove(
'hidden'
);

}
);

})();
