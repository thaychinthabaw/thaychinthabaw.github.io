(() => {
'use strict';

/* =========================
   GLOBAL STATE
========================= */
let currentLineHeight = 2.0;
let currentLetterSpacing = 0;

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
   SETTING OVERLAY
========================= */
function toggleSetting() {
    const setting = document.getElementById('setting-overlay');
    if (!setting) return;

    const isOpen = setting.style.display === 'block';
    setting.style.display = isOpen ? 'none' : 'block';
}

/* =========================
   DOWNLOAD (PRINT)
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
   LINE HEIGHT SYSTEM
========================= */
function applyLineHeight() {
    const content = document.getElementById('reading-content');

    if (content) {
        content.style.lineHeight = currentLineHeight;
    }

    const display = document.getElementById('lh-display');
    if (display) {
        display.innerText = currentLineHeight.toFixed(1);
    }

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
   LETTER SPACING SYSTEM
========================= */
function applyLetterSpacing() {
    const content = document.getElementById('reading-content');

    if (content) {
        content.style.letterSpacing = currentLetterSpacing + 'px';
    }

    const display = document.getElementById('ls-display');
    if (display) {
        display.innerText = currentLetterSpacing;
    }

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
   FONT SIZE SYSTEM
========================= */
let fontSize = parseInt(localStorage.getItem('userFontSize')) || 25;

function renderFontSize() {
    const article = document.querySelector('article');

    if (article) {
        article.style.fontSize = fontSize + 'px';
    }

    const display = document.getElementById('font-size-display');
    if (display) display.textContent = fontSize;

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
   FONT WEIGHT SYSTEM
========================= */
let currentWeight = parseInt(localStorage.getItem('userFontWeight')) || 500;

function renderWeight() {
    const article = document.querySelector('article');

    if (article) {
        article.style.fontWeight = currentWeight;
    }

    const h = document.getElementById('digit-hundreds');
    const t = document.getElementById('digit-tens');
    const o = document.getElementById('digit-ones');

    if (h) h.textContent = Math.floor(currentWeight / 100);
    if (t) t.textContent = Math.floor((currentWeight % 100) / 10);
    if (o) o.textContent = currentWeight % 10;

    document.querySelectorAll('#weight-buttons .preset-btn').forEach(btn => {
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

    /* LOAD SETTINGS */
    const savedLH = localStorage.getItem('userLineHeight');
    if (savedLH) currentLineHeight = parseFloat(savedLH);

    const savedLS = localStorage.getItem('userLetterSpacing');
    if (savedLS) currentLetterSpacing = parseFloat(savedLS);

    applyLineHeight();
    applyLetterSpacing();
    renderFontSize();
    renderWeight();

    /* BUILD TEXT */
    buildSemanticParagraphs();
    restoreReadingPosition();

    /* SAVE POSITION ON SCROLL */
    let timer;
    window.addEventListener('scroll', () => {
        clearTimeout(timer);
        timer = setTimeout(saveReadingPosition, 200);
    });

    /* TOC SEARCH */
    const tocSearch = document.getElementById('toc-search');
    const tocItems = document.querySelectorAll('.toc-list li');

    if (tocSearch) {
        tocSearch.addEventListener('input', () => {
            const q = tocSearch.value.toLowerCase();

            tocItems.forEach(i => {
                i.style.display = i.textContent.toLowerCase().includes(q)
                    ? 'block'
                    : 'none';
            });
        });
    }

    /* LINE BUTTONS */
    document.querySelectorAll('.line-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentLineHeight = parseFloat(btn.dataset.value);
            applyLineHeight();
        });
    });

    /* LETTER BUTTONS */
    document.querySelectorAll('.letter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentLetterSpacing = parseFloat(btn.dataset.value);
            applyLetterSpacing();
        });
    });

    /* FONT BUTTONS */
    document.getElementById('font-increase')?.addEventListener('click', () => changeFontSize(1));
    document.getElementById('font-decrease')?.addEventListener('click', () => changeFontSize(-1));
    document.getElementById('size-plus-10')?.addEventListener('click', () => changeFontSize(10));
    document.getElementById('size-minus-10')?.addEventListener('click', () => changeFontSize(-10));
    document.getElementById('size-plus-1')?.addEventListener('click', () => changeFontSize(1));
    document.getElementById('size-minus-1')?.addEventListener('click', () => changeFontSize(-1));

    /* WEIGHT BUTTONS */
    document.querySelectorAll('#weight-buttons .preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentWeight = parseInt(btn.dataset.weight);
            renderWeight();
        });
    });

    document.getElementById('weight-plus-100')?.addEventListener('click', () => changeWeight(100));
    document.getElementById('weight-minus-100')?.addEventListener('click', () => changeWeight(-100));
    document.getElementById('weight-plus-10')?.addEventListener('click', () => changeWeight(10));
    document.getElementById('weight-minus-10')?.addEventListener('click', () => changeWeight(-10));
    document.getElementById('weight-plus-1')?.addEventListener('click', () => changeWeight(1));
    document.getElementById('weight-minus-1')?.addEventListener('click', () => changeWeight(-1));

    /* TOGGLE EXPORT */
    window.toggleTOC = toggleTOC;
    window.toggleSetting = toggleSetting;
    window.downloadPDF = downloadPDF;
    window.toggleReadingMode = toggleReadingMode;
    window.adjustLineHeight = adjustLineHeight;
    window.adjustLetterSpacing = adjustLetterSpacing;
}

/* START */
document.addEventListener('DOMContentLoaded', init);

})();
