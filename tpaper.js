/* =========================
UI CONTROLLER
========================= */

function toggleTOC() {
document.getElementById('toc-overlay').classList.toggle('show');
}

function toggleSetting() {
document.getElementById('setting-overlay').classList.toggle('show');
}

function downloadPDF() {
window.print();
}

function toggleReadingMode() {
document.body.classList.toggle('focus-mode');
}

/* INIT */
document.addEventListener('DOMContentLoaded', () => {

buildSemanticParagraphs();
restoreReadingPosition();

window.addEventListener('scroll', () => {
saveReadingPosition();
});

});
