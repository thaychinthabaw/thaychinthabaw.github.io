(() => {

'use strict';

/* =========================
   QUIZ DATA
========================= */

const quizData = {

1: [

{
question: "ဗုဒ္ဓဘာသာ၏ အဓိကအဆုံးအမမှာ ဘာလဲ?",
answers: [
"အနိစ္စ",
"မေတ္တာ",
"သစ္စာလေးပါး",
"သမာဓိ"
],
correct: 2
},

{
question: "အရာအားလုံး မတည်မြဲခြင်းကို ဘာခေါ်သလဲ?",
answers: [
"ဒုက္ခ",
"အနိစ္စ",
"အနတ္တ",
"သမာဓိ"
],
correct: 1
},

{
question: "ဝိပဿနာဆိုသည်မှာ?",
answers: [
"သီချင်းဆိုခြင်း",
"အိပ်စက်ခြင်း",
"ရှုမှတ်ခြင်း",
"စာရေးခြင်း"
],
correct: 2
}

],

2: [

{
question: "သတိ၏ အဓိပ္ပါယ်မှာ?",
answers: [
"မေ့ခြင်း",
"သိနေခြင်း",
"အိပ်ခြင်း",
"ပျင်းခြင်း"
],
correct: 1
},

{
question: "ဒုက္ခသစ္စာ ဆိုသည်မှာ?",
answers: [
"ချမ်းသာခြင်း",
"မတည်မြဲခြင်း",
"ဆင်းရဲခြင်း",
"မေတ္တာ"
],
correct: 2
}

],

3: [

{
question: "အနတ္တ ဆိုသည်မှာ?",
answers: [
"ကိုယ်ပိုင်မရှိခြင်း",
"ကြီးမြတ်ခြင်း",
"ချမ်းသာခြင်း",
"တည်မြဲခြင်း"
],
correct: 0
},

{
question: "နိဗ္ဗာန်သည်?",
answers: [
"အိပ်မက်",
"အဆုံးစွန်ငြိမ်းချမ်းမှု",
"ဒေါသ",
"လောဘ"
],
correct: 1
}

]

};

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

/* =========================
   STATE
========================= */

let currentChapter = [];
let currentIndex = 0;
let answered = false;

/* =========================
   START QUIZ
========================= */

chapterButtons.forEach(button => {

button.addEventListener('click', () => {

const chapterNumber =
button.dataset.chapter;

currentChapter =
quizData[chapterNumber];

currentIndex = 0;

chapterScreen.classList.add('hidden');

finishScreen.classList.add('hidden');

quizScreen.classList.remove('hidden');

showQuestion();

});

});

/* =========================
   SHOW QUESTION
========================= */

function showQuestion() {

answered = false;

nextBtn.style.display = 'none';

const currentQuestion =
currentChapter[currentIndex];

questionText.textContent =
currentQuestion.question;

questionCount.textContent =
`${currentIndex + 1} / ${currentChapter.length}`;

answersContainer.innerHTML = '';

currentQuestion.answers.forEach(
(answer, index) => {

const button =
document.createElement('button');

button.className = 'answer-btn';

button.textContent = answer;

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

function selectAnswer(button, index) {

if (answered) return;

answered = true;

const currentQuestion =
currentChapter[currentIndex];

const buttons =
document.querySelectorAll('.answer-btn');

buttons.forEach((btn, i) => {

if (i === currentQuestion.correct) {
btn.classList.add('correct');
}

if (
i === index &&
i !== currentQuestion.correct
) {
btn.classList.add('wrong');
}

});

nextBtn.style.display = 'inline-block';

}

/* =========================
   NEXT
========================= */

nextBtn.addEventListener('click', () => {

currentIndex++;

if (currentIndex >= currentChapter.length) {

quizScreen.classList.add('hidden');

finishScreen.classList.remove('hidden');

return;

}

showQuestion();

});

/* =========================
   BACK
========================= */

backBtn.addEventListener('click', () => {

quizScreen.classList.add('hidden');

finishScreen.classList.add('hidden');

chapterScreen.classList.remove('hidden');

});

/* =========================
   RESTART
========================= */

restartBtn.addEventListener('click', () => {

finishScreen.classList.add('hidden');

chapterScreen.classList.remove('hidden');

});

})();
