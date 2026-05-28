(() => {
'use strict';
/* =========================
   FONT SIZE SYSTEM
========================= */
let fontSize = parseInt(localStorage.getItem('userFontSize')) || 25;
const articleElement = document.querySelector('article');
function renderFontSize() {
    if (articleElement) {
        articleElement.style.fontSize = fontSize + 'px';
    }
    const fontDisplay = document.getElementById('font-size-display');
    if (fontDisplay) {
        fontDisplay.textContent = fontSize;
    }
    const sizeTens = document.getElementById('size-tens');
    const sizeOnes = document.getElementById('size-ones');
    if (sizeTens) {
        sizeTens.textContent = Math.floor(fontSize / 10);
    }
    if (sizeOnes) {
        sizeOnes.textContent = fontSize % 10;
    }
    localStorage.setItem('userFontSize', fontSize);
}
function changeFontSize(amount) {
    const next = fontSize + amount;
    if (next >= 10 && next <= 70) {
        fontSize = next;
        renderFontSize();
    }
}
/* =========================
   FONT WEIGHT SYSTEM
========================= */
let currentWeight = parseInt(localStorage.getItem('userFontWeight')) || 500;
const weightButtons = document.querySelectorAll('#weight-buttons .preset-btn');
function renderWeight() {
    if (articleElement) {
        articleElement.style.fontWeight = currentWeight;
    }
    const hundreds = document.getElementById('digit-hundreds');
    const tens = document.getElementById('digit-tens');
    const ones = document.getElementById('digit-ones');
    if (hundreds) {
        hundreds.textContent = Math.floor(currentWeight / 100);
    }
    if (tens) {
        tens.textContent = Math.floor((currentWeight % 100) / 10);
    }
    if (ones) {
        ones.textContent = currentWeight % 10;
    }
    weightButtons.forEach(btn => {
        btn.classList.toggle('active-preset', parseInt(btn.dataset.weight) === currentWeight);
    });
    localStorage.setItem('userFontWeight', currentWeight);
}
function changeWeight(amount) {
    const next = currentWeight + amount;
    if (next >= 100 && next <= 900) {
        currentWeight = next;
        renderWeight();
    }
}
/* =========================
   INIT
========================= */
function initTextSystem() {
    renderFontSize();
    renderWeight();
    /* FONT SIZE BUTTONS */
    const fontIncrease = document.getElementById('font-increase');
    if (fontIncrease) { fontIncrease.onclick = () => { changeFontSize(1); }; }
    const fontDecrease = document.getElementById('font-decrease');
    if (fontDecrease) { fontDecrease.onclick = () => { changeFontSize(-1); }; }
    const sizePlus10 = document.getElementById('size-plus-10');
    if (sizePlus10) { sizePlus10.onclick = () => { changeFontSize(10); }; }
    const sizeMinus10 = document.getElementById('size-minus-10');
    if (sizeMinus10) { sizeMinus10.onclick = () => { changeFontSize(-10); }; }
    const sizePlus1 = document.getElementById('size-plus-1');
    if (sizePlus1) { sizePlus1.onclick = () => { changeFontSize(1); }; }
    const sizeMinus1 = document.getElementById('size-minus-1');
    if (sizeMinus1) { sizeMinus1.onclick = () => { changeFontSize(-1); }; }
    /* WEIGHT BUTTONS */
    weightButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentWeight = parseInt(btn.dataset.weight);
            renderWeight();
        });
    });
    const weightPlus100 = document.getElementById('weight-plus-100');
    if (weightPlus100) { weightPlus100.onclick = () => { changeWeight(100); }; }
    const weightMinus100 = document.getElementById('weight-minus-100');
    if (weightMinus100) { weightMinus100.onclick = () => { changeWeight(-100); }; }
    const weightPlus10 = document.getElementById('weight-plus-10');
    if (weightPlus10) { weightPlus10.onclick = () => { changeWeight(10); }; }
    const weightMinus10 = document.getElementById('weight-minus-10');
    if (weightMinus10) { weightMinus10.onclick = () => { changeWeight(-10); }; }
    const weightPlus1 = document.getElementById('weight-plus-1');
    if (weightPlus1) { weightPlus1.onclick = () => { changeWeight(1); }; }
    const weightMinus1 = document.getElementById('weight-minus-1');
    if (weightMinus1) { weightMinus1.onclick = () => { changeWeight(-1); }; }
}
document.addEventListener('DOMContentLoaded', initTextSystem);
})();
