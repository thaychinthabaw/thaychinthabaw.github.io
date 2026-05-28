paper.js

(() => {
'use strict';

/* =========================
TOGGLE TOC
========================= */

function toggleTOC() {

const tocOverlay =
document.getElementById(
'toc-overlay'
);

if (!tocOverlay) return;

const isOpening =
tocOverlay.style.display !== 'block';

if (isOpening) {

tocOverlay.style.display =
'block';

} else {

tocOverlay.style.display =
'none';
}
}

/* =========================
TOGGLE SETTINGS
========================= */

function toggleSetting() {

const settingOverlay =
document.getElementById(
'setting-overlay'
);

if (!settingOverlay) return;

const isVisible =
settingOverlay.style.display === 'block';

settingOverlay.style.display =
isVisible
? 'none'
: 'block';
}

/* =========================
LAST READ
========================= */

function saveCurrentPage() {

localStorage.setItem(
'lastReadTitle',
document.title
);

localStorage.setItem(
'lastReadUrl',
window.location.href
);
}

function showLastReadLink() {

const lastTitle =
localStorage.getItem(
'lastReadTitle'
);

const lastUrl =
localStorage.getItem(
'lastReadUrl'
);

const lastReadContainer =
document.getElementById(
'last-read-container'
);

if (
lastTitle &&
lastUrl &&
window.location.href !== lastUrl &&
lastReadContainer
) {

lastReadContainer.innerHTML = `
<div style="background:#eadebc;padding:15px;border-radius:8px;">
<a href="${lastUrl}">
📖 ${lastTitle}
</a>
</div>
`;
}
}

/* =========================
INIT
========================= */

function init() {

buildSemanticParagraphs();

restoreReadingPosition();

/* line height */

const savedLH =
localStorage.getItem(
'userLineHeight'
);

if (savedLH !== null) {

currentLineHeight =
parseFloat(savedLH);
}

applyLineHeight();

/* letter spacing */

const savedLS =
localStorage.getItem(
'userLetterSpacing'
);

if (savedLS !== null) {

currentLetterSpacing =
parseFloat(savedLS);
}

applyLetterSpacing();

/* last read */

saveCurrentPage();

showLastReadLink();

/* auto save */

let readingTimer;

window.addEventListener(
'scroll',
() => {

clearTimeout(
readingTimer
);

readingTimer =
setTimeout(() => {

saveReadingPosition();

}, 200);
});
}

/* =========================
EXPORT
========================= */

window.toggleTOC =
toggleTOC;

window.toggleSetting =
toggleSetting;

/* =========================
DOMContentLoaded
========================= */

document.addEventListener(
'DOMContentLoaded',
init
);

})();
