(() => {
'use strict';

/* =========================
   GLOBAL STATE
========================= */
let currentLineHeight = 2.0;
let currentLetterSpacing = 0;
let fontSize = parseInt(localStorage.getItem('userFontSize')) || 25;
let currentWeight = parseInt(localStorage.getItem('userFontWeight')) || 500;

/* =========================
   SEMANTIC SYSTEM
========================= */
function buildSemanticParagraphs() {
    const containers = document.querySelectorAll('.raw-text');
    let globalIndex = 1;

    containers.forEach(container => {
        const rawText = container.textContent.trim();
        const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim() !== '');

        container.innerHTML = '';

        paragraphs.forEach(text => {
            const cleanText = text.trim();

            if (cleanText === '@@gap') {
                const gap = document.createElement('div');
                gap.className = 'big-gap';
                container.appendChild(gap);
                return;
            }

            const p = document.createElement('p');
            p.dataset.p = globalIndex;
            p.textContent = cleanText;
            container.appendChild(p);

            globalIndex++;
        });
    });
}

/* =========================
   READING POSITION SYSTEM
========================= */
function saveReadingPosition() {
    const paragraphs = document.querySelectorAll('.raw-text p');

    let currentParagraph = null;
    let offsetRatio = 0;

    paragraphs.forEach(p => {
        const rect = p.getBoundingClientRect();

        if (rect.top <= window.innerHeight * 0.35 && rect.bottom > 0) {
            currentParagraph = p.dataset.p;
            offsetRatio = Math.abs(rect.top) / rect.height;
        }
    });

    if (currentParagraph) {
        localStorage.setItem('readingPosition', JSON.stringify({
            paragraph: currentParagraph,
            offsetRatio
        }));
    }
}

function restoreReadingPosition() {
    const saved = localStorage.getItem('readingPosition');
    if (!saved) return;

    let data;
    try {
        data = JSON.parse(saved);
    } catch {
        return;
    }

    setTimeout(() => {
        const target = document.querySelector(`[data-p="${data.paragraph}"]`);
        if (!target) return;

        const offset = target.offsetHeight * (data.offsetRatio || 0);
        const finalY = target.offsetTop + offset - 120;

        window.scrollTo({
            top: finalY,
            behavior: 'smooth'
        });
    }, 500);
}

/* =========================
   TOC SYSTEM
========================= */
function toggleTOC() {
    const toc = document.getElementById('toc-overlay');
    if (!toc) return;

    const isOpen = toc.style.display === 'block';
    toc.style.display = isOpen ? 'none' : 'block';
}

function clearTOCSearch() {
    const input = document.getElementById('toc-search');
    const items = document.querySelectorAll('.toc-list li');

    if (input) input.value = '';
    items.forEach(i => i.style.display = 'block');
}

/* =========================
   SETTING
========================= */
function toggleSetting() {
    const setting = document.getElementById('setting-overlay');
    if (!setting) return;

    const isOpen = setting.style.display === 'block';
    setting.style.display = isOpen ? 'none' : 'block';
}

/* =========================
   DOWNLOAD / PRINT
========================= */
function downloadPDF() {
    toggleSetting();
    setTimeout(() => window.print(), 400);
}

/* =========================
   FOCUS MODE
========================= */
function toggleReadingMode() {
    document.body.classList.toggle('focus-mode');
}

/* =========================
   LINE HEIGHT
========================= */
function applyLineHeight() {
    const content = document.getElementById('reading-content');

    if (content) content.style.lineHeight = currentLineHeight;

    const display = document.getElementById('lh-display');
    if (display) display.innerText = currentLineHeight.toFixed(1);

    document.querySelectorAll('.line-btn').forEach(btn => {
        btn.classList.toggle(
            'active-preset',
            parseFloat(btn.dataset.value) === currentLineHeight
        );
    });

    localStorage.setItem('userLineHeight', currentLineHeight);
}

function adjustLineHeight(amount) {
    saveReadingPosition();

    let next = Math.round((currentLineHeight + amount) * 10) / 10;

    if (next >= 1 && next <= 5) {
        currentLineHeight = next;
        applyLineHeight();
        setTimeout(restoreReadingPosition, 100);
    }
}

/* =========================
   LETTER SPACING
========================= */
function applyLetterSpacing() {
    const content = document.getElementById('reading-content');

    if (content) content.style.letterSpacing = currentLetterSpacing + 'px';

    const display = document.getElementById('ls-display');
    if (display) display.innerText = currentLetterSpacing;

    document.querySelectorAll('.letter-btn').forEach(btn => {
        btn.classList.toggle(
            'active-preset',
            parseFloat(btn.dataset.value) === currentLetterSpacing
        );
    });

    localStorage.setItem('userLetterSpacing', currentLetterSpacing);
}

function adjustLetterSpacing(amount) {
    saveReadingPosition();

    let next = Math.round((currentLetterSpacing + amount) * 10) / 10;

    if (next >= 0 && next <= 10) {
        currentLetterSpacing = next;
        applyLetterSpacing();
        setTimeout(restoreReadingPosition, 100);
    }
}

/* =========================
   FONT SIZE
========================= */
function renderFontSize() {
    const article = document.querySelector('article');

    if (article) article.style.fontSize = fontSize + 'px';

    document.getElementById('font-size-display') &&
    (document.getElementById('font-size-display').textContent = fontSize);

    document.getElementById('size-tens') &&
    (document.getElementById('size-tens').textContent = Math.floor(fontSize / 10));

    document.getElementById('size-ones') &&
    (document.getElementById('size-ones').textContent = fontSize % 10);

    localStorage.setItem('userFontSize', fontSize);
}

function changeFontSize(amount) {
    saveReadingPosition();

    const next = fontSize + amount;

    if (next >= 10 && next <= 70) {
        fontSize = next;
        renderFontSize();
        setTimeout(restoreReadingPosition, 100);
    }
}

/* =========================
   FONT WEIGHT
========================= */
function renderWeight() {
    const article = document.querySelector('article');

    if (article) article.style.fontWeight = currentWeight;

    document.querySelectorAll('#weight-buttons .preset-btn')
        .forEach(btn => {
            btn.classList.toggle(
                'active-preset',
                parseInt(btn.dataset.weight) === currentWeight
            );
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
function init() {

    /* load settings */
    const savedLH = localStorage.getItem('userLineHeight');
    if (savedLH) currentLineHeight = parseFloat(savedLH);

    const savedLS = localStorage.getItem('userLetterSpacing');
    if (savedLS) currentLetterSpacing = parseFloat(savedLS);

    applyLineHeight();
    applyLetterSpacing();
    renderFontSize();
    renderWeight();

    /* build text */
    buildSemanticParagraphs();
    restoreReadingPosition();

    /* scroll save */
    let timer;
    window.addEventListener('scroll', () => {
        clearTimeout(timer);
        timer = setTimeout(saveReadingPosition, 200);
    });

    /* TOC search */
    const tocSearch = document.getElementById('toc-search');
    const tocItems = document.querySelectorAll('.toc-list li');

    if (tocSearch) {
        tocSearch.addEventListener('input', () => {
            const q = tocSearch.value.toLowerCase();

            tocItems.forEach(i => {
                i.style.display =
                    i.textContent.toLowerCase().includes(q)
                        ? 'block'
                        : 'none';
            });
        });
    }

    /* buttons */
    document.querySelectorAll('.line-btn')
        .forEach(btn =>
            btn.addEventListener('click', () => {
                currentLineHeight = parseFloat(btn.dataset.value);
                applyLineHeight();
            })
        );

    document.querySelectorAll('.letter-btn')
        .forEach(btn =>
            btn.addEventListener('click', () => {
                currentLetterSpacing = parseFloat(btn.dataset.value);
                applyLetterSpacing();
            })
        );

    document.getElementById('font-increase')?.addEventListener('click', () => changeFontSize(1));
    document.getElementById('font-decrease')?.addEventListener('click', () => changeFontSize(-1));

    document.querySelectorAll('#weight-buttons .preset-btn')
        .forEach(btn =>
            btn.addEventListener('click', () => {
                currentWeight = parseInt(btn.dataset.weight);
                renderWeight();
            })
        );

    /* export */
    window.toggleTOC = toggleTOC;
    window.toggleSetting = toggleSetting;
    window.downloadPDF = downloadPDF;
    window.toggleReadingMode = toggleReadingMode;
    window.adjustLineHeight = adjustLineHeight;
    window.adjustLetterSpacing = adjustLetterSpacing;
}

/* start */
document.addEventListener('DOMContentLoaded', init);

})();
