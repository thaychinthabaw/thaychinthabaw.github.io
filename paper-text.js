(() => {
'use strict';

/* ========================= GLOBAL STATE ========================= */
let currentLineHeight = 2.0;
let currentLetterSpacing = 0;

/* ========================= SEMANTIC SYSTEM ========================= */
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

/* ========================= READING POSITION SYSTEM ========================= */
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
    }, 600);
}

/* ========================= TOGGLE SYSTEM ========================= */
function toggleTOC() {
    const tocOverlay = document.getElementById('toc-overlay');
    if (!tocOverlay) return;

    const isOpening = tocOverlay.style.display !== 'block';

    if (isOpening) {
        tocOverlay.style.display = 'block';

        setTimeout(() => {
            const activeItem = document.querySelector('.active-chapter');
            const tocList = document.querySelector('.toc-list');

            if (activeItem && tocList) {
                activeItem.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 100);
    } else {
        tocOverlay.style.display = 'none';
        clearTOCSearch();
    }
}

function toggleSetting() {
    const settingOverlay = document.getElementById('setting-overlay');
    if (!settingOverlay) return;

    const isVisible = settingOverlay.style.display === 'block';
    settingOverlay.style.display = isVisible ? 'none' : 'block';
}

function downloadPDF() {
    toggleSetting();
    setTimeout(() => window.print(), 500);
}

function toggleReadingMode() {
    document.body.classList.toggle('focus-mode');

    const fsBtn = document.getElementById('fs-btn');

    if (document.body.classList.contains('focus-mode')) {
        fsBtn.innerHTML = '✖';
        fsBtn.style.background = 'rgba(234, 222, 188, 0.2)';
    } else {
        fsBtn.innerHTML = '⛶';
        fsBtn.style.background = 'rgba(234, 222, 188, 0.4)';
    }
}

/* ========================= LAST READ SYSTEM ========================= */
function saveCurrentPage() {
    localStorage.setItem('lastReadTitle', document.title);
    localStorage.setItem('lastReadUrl', window.location.href);
}

function showLastReadLink() {
    const lastTitle = localStorage.getItem('lastReadTitle');
    const lastUrl = localStorage.getItem('lastReadUrl');
    const container = document.getElementById('last-read-container');

    if (lastTitle && lastUrl && window.location.href !== lastUrl && container) {
        container.innerHTML = `
            <div style="background:#eadebc;border:1px solid #443300;padding:15px;margin:10px;border-radius:8px;text-align:center;">
                <p style="color:#443300;font-size:14px;margin-bottom:5px;">
                    သင်နောက်ဆုံး ဖတ်လက်စအပိုင်း -
                </p>
                <a href="${lastUrl}" style="color:#443300;font-weight:bold;text-decoration:none;">
                    📖 ${lastTitle} သို့ ပြန်သွားရန်
                </a>
            </div>
        `;
    }
}

/* ========================= LINE HEIGHT ========================= */
let currentLineHeight = parseFloat(localStorage.getItem('userLineHeight')) || 2.0;

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

    if (next >= 1.0 && next <= 100.0) {
        currentLineHeight = next;
        applyLineHeight();
        setTimeout(restoreReadingPosition, 100);
    }
}

/* ========================= LETTER SPACING ========================= */
let currentLetterSpacing = parseFloat(localStorage.getItem('userLetterSpacing')) || 0;

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

/* ========================= TOC SEARCH ========================= */
function clearTOCSearch() {
    const input = document.getElementById('toc-search');
    const items = document.querySelectorAll('.toc-list li');

    if (input) input.value = '';

    items.forEach(i => i.style.display = 'block');
}

/* ========================= FONT SIZE ========================= */
let fontSize = parseInt(localStorage.getItem('userFontSize')) || 25;

function renderFontSize() {
    const article = document.querySelector('article');

    if (article) article.style.fontSize = fontSize + 'px';

    const display = document.getElementById('font-size-display');
    if (display) display.textContent = fontSize;
}

/* ========================= FONT WEIGHT ========================= */
let currentWeight = parseInt(localStorage.getItem('userFontWeight')) || 500;

function renderWeight() {
    const article = document.querySelector('article');

    if (article) article.style.fontWeight = currentWeight;
}

/* ========================= INIT ========================= */
function init() {
    buildSemanticParagraphs();

    const savedLH = localStorage.getItem('userLineHeight');
    if (savedLH) currentLineHeight = parseFloat(savedLH);

    const savedLS = localStorage.getItem('userLetterSpacing');
    if (savedLS) currentLetterSpacing = parseFloat(savedLS);

    applyLineHeight();
    applyLetterSpacing();
    renderFontSize();
    renderWeight();

    saveCurrentPage();
    showLastReadLink();

    restoreReadingPosition();

    let timer;
    window.addEventListener('scroll', () => {
        clearTimeout(timer);
        timer = setTimeout(saveReadingPosition, 200);
    });

    window.toggleTOC = toggleTOC;
    window.toggleSetting = toggleSetting;
    window.downloadPDF = downloadPDF;
    window.toggleReadingMode = toggleReadingMode;
    window.adjustLineHeight = adjustLineHeight;
    window.adjustLetterSpacing = adjustLetterSpacing;
}

/* ========================= START ========================= */
document.addEventListener('DOMContentLoaded', init);

})();
