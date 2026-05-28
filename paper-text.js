/* =========================
TEXT / READER SYSTEM
========================= */

let currentLineHeight = 2.0;
let currentLetterSpacing = 0;

function buildSemanticParagraphs() {

const containers = document.querySelectorAll('.raw-text');
let globalIndex = 1;

containers.forEach(container => {

const raw = container.textContent.trim();

const paragraphs = raw.split(/\n\s*\n/);

container.innerHTML = '';

paragraphs.forEach(t => {

const p = document.createElement('p');
p.dataset.p = globalIndex++;
p.textContent = t.trim();

container.appendChild(p);

});

});

}

function saveReadingPosition() {
const ps = document.querySelectorAll('.raw-text p');
let id = null;

ps.forEach(p => {
const r = p.getBoundingClientRect();
if (r.top < window.innerHeight * 0.4) {
id = p.dataset.p;
}
});

if (id) {
localStorage.setItem('reading', id);
}
}

function restoreReadingPosition() {

const id = localStorage.getItem('reading');
if (!id) return;

const el = document.querySelector(`[data-p="${id}"]`);
if (!el) return;

window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });

}

/* expose */
window.buildSemanticParagraphs = buildSemanticParagraphs;
window.saveReadingPosition = saveReadingPosition;
window.restoreReadingPosition = restoreReadingPosition;
