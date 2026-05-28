(() => {
'use strict';

/* ========================= STATE ========================= */
let currentLineHeight = 2.0;
let currentLetterSpacing = 0;
let fontSize = parseInt(localStorage.getItem('userFontSize')) || 25;
let currentWeight = parseInt(localStorage.getItem('userFontWeight')) || 500;

/* ========================= SEMANTIC ========================= */
function buildSemanticParagraphs() {
const containers = document.querySelectorAll('.raw-text');
let globalIndex = 1;

containers.forEach(container => {
const raw = container.textContent.trim();
const paragraphs = raw.split(/\n\s*\n/).filter(p => p.trim());

container.innerHTML = '';

paragraphs.forEach(text => {
if (text.trim() === '@@gap') {
const gap = document.createElement('div');
gap.className = 'big-gap';
container.appendChild(gap);
return;
}

const p = document.createElement('p');
p.dataset.p = globalIndex++;
p.textContent = text.trim();
container.appendChild(p);
});
});
}

/* ========================= SAVE / RESTORE ========================= */
function saveReadingPosition() {
const ps = document.querySelectorAll('.raw-text p');
let current = null;
let ratio = 0;

ps.forEach(p => {
const r = p.getBoundingClientRect();
if (r.top <= window.innerHeight * 0.35 && r.bottom > 0) {
current = p.dataset.p;
ratio = Math.abs(r.top) / r.height;
}
});

if (current) {
localStorage.setItem('readingPosition', JSON.stringify({
paragraph: current,
offsetRatio: ratio
}));
}
}

function restoreReadingPosition() {
const data = JSON.parse(localStorage.getItem('readingPosition') || '{}');
if (!data.paragraph) return;

setTimeout(() => {
const el = document.querySelector(`[data-p="${data.paragraph}"]`);
if (!el) return;

const offset = el.offsetTop + (el.offsetHeight * (data.offsetRatio || 0)) - 120;

window.scrollTo({ top: offset, behavior: 'smooth' });
}, 500);
}

/* ========================= TOC ========================= */
function toggleTOC() {
const toc = document.getElementById('toc-overlay');
if (!toc) return;

toc.style.display = toc.style.display === 'block' ? 'none' : 'block';
}

function toggleSetting() {
const s = document.getElementById('setting-overlay');
if (!s) return;

s.style.display = s.style.display === 'block' ? 'none' : 'block';
}

/* ========================= LINE HEIGHT ========================= */
function applyLineHeight() {
const c = document.getElementById('reading-content');
if (c) c.style.lineHeight = currentLineHeight;
localStorage.setItem('userLineHeight', currentLineHeight);
}

function adjustLineHeight(v) {
saveReadingPosition();
currentLineHeight = Math.max(1, Math.min(100, currentLineHeight + v));
applyLineHeight();
setTimeout(restoreReadingPosition, 100);
}

/* ========================= LETTER SPACING ========================= */
function applyLetterSpacing() {
const c = document.getElementById('reading-content');
if (c) c.style.letterSpacing = currentLetterSpacing + 'px';
localStorage.setItem('userLetterSpacing', currentLetterSpacing);
}

function adjustLetterSpacing(v) {
saveReadingPosition();
currentLetterSpacing = Math.max(0, Math.min(10, currentLetterSpacing + v));
applyLetterSpacing();
setTimeout(restoreReadingPosition, 100);
}

/* ========================= FONT SIZE ========================= */
function applyFontSize() {
const a = document.querySelector('article');
if (a) a.style.fontSize = fontSize + 'px';
localStorage.setItem('userFontSize', fontSize);
}

function changeFontSize(v) {
saveReadingPosition();
fontSize = Math.max(10, Math.min(70, fontSize + v));
applyFontSize();
setTimeout(restoreReadingPosition, 100);
}

/* ========================= FONT WEIGHT ========================= */
function applyWeight() {
const a = document.querySelector('article');
if (a) a.style.fontWeight = currentWeight;
localStorage.setItem('userFontWeight', currentWeight);
}

function changeWeight(v) {
currentWeight = Math.max(100, Math.min(900, currentWeight + v));
applyWeight();
}

/* ========================= INIT ========================= */
function init() {
buildSemanticParagraphs();
restoreReadingPosition();

applyLineHeight();
applyLetterSpacing();
applyFontSize();
applyWeight();

/* save position */
window.addEventListener('scroll', () => {
clearTimeout(window._t);
window._t = setTimeout(saveReadingPosition, 200);
});

/* export */
window.toggleTOC = toggleTOC;
window.toggleSetting = toggleSetting;
window.adjustLineHeight = adjustLineHeight;
window.adjustLetterSpacing = adjustLetterSpacing;
window.changeFontSize = changeFontSize;
window.changeWeight = changeWeight;
}

/* ========================= START ========================= */
document.addEventListener('DOMContentLoaded', init);

})();
