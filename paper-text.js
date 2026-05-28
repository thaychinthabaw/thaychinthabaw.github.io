(() => {
'use strict';

/* ==
   GLOBAL STATE
== */
let currentLineHeight = 2.0;
let currentLetterSpacing = 0;

/* == SEMANTIC SYSTEM == */
function buildSemanticParagraphs() {
    const containers = document.querySelectorAll('.raw-text');
    let globalIndex = 1;

    containers.forEach((container) => {

        const rawText = container.textContent.trim();
        const paragraphs = rawText
            .split(/\n\s*\n/)
            .filter(p => p.trim() !== '');

        container.innerHTML = '';

        paragraphs.forEach((text) => {
            const cleanText = text.trim();

            if (cleanText === '@@gap') {
                const gap = document.createElement('div');
                gap.className = 'big-gap';
                container.appendChild(gap);
                return;
            }

            const p = document.createElement('p');
            p.setAttribute('data-p', globalIndex);
            p.textContent = cleanText;

            container.appendChild(p);
            globalIndex++;
        });
    });
}

function saveReadingPosition() {
    const paragraphs = document.querySelectorAll('.raw-text p');
    let currentParagraph = null;
    let offsetRatio = 0;

    paragraphs.forEach(p => {
        const rect = p.getBoundingClientRect();

        if (
            rect.top <= window.innerHeight * 0.35 &&
            rect.bottom > 0
        ) {
            currentParagraph = p.dataset.p;

            offsetRatio =
                Math.abs(rect.top) / rect.height;
        }
    });

    if (currentParagraph) {
        localStorage.setItem(
            'readingPosition',
            JSON.stringify({
                paragraph: currentParagraph,
                offsetRatio: offsetRatio
            })
        );
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
        const target =
            document.querySelector(`[data-p="${data.paragraph}"]`);
        if (!target) return;

        const paragraphHeight = target.offsetHeight;
        const offset =
            paragraphHeight * (data.offsetRatio || 0);

        const absoluteTop = target.offsetTop;
        const finalY = absoluteTop + offset - 120;

        window.scrollTo({
            top: finalY,
            behavior: 'smooth'
        });
    }, 600);
}

/* ==
   TOGGLE SYSTEM
== */
function toggleTOC() {
    const tocOverlay = document.getElementById('toc-overlay');
    if (!tocOverlay) return;

    const isOpening = tocOverlay.style.display !== 'block';

    if (isOpening) {
        tocOverlay.style.display = 'block';

        setTimeout(() => {
            const activeItem = document.querySelector('.active-chapter');
            if (activeItem) {
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
    setTimeout(() => {
        window.print();
    }, 500);
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

/* ==
   LAST READ SYSTEM
== */
function saveCurrentPage() {
    localStorage.setItem('lastReadTitle', document.title);
    localStorage.setItem('lastReadUrl', window.location.href);
}

function showLastReadLink() {
    const lastTitle = localStorage.getItem('lastReadTitle');
    const lastUrl = localStorage.getItem('lastReadUrl');

    const lastReadContainer =
        document.getElementById('last-read-container');

    if (
        lastTitle &&
        lastUrl &&
        window.location.href !== lastUrl &&
        lastReadContainer
    ) {
        lastReadContainer.innerHTML = `
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

/* ==
   LINE HEIGHT SYSTEM
== */
function applyLineHeight() {
    const content = document.getElementById('reading-content');

    if (content) {
        content.style.lineHeight = currentLineHeight;
    }

    const lhDisplay = document.getElementById('lh-display');
    if (lhDisplay) {
        lhDisplay.innerText = currentLineHeight.toFixed(1);
    }

    localStorage.setItem('userLineHeight', currentLineHeight);
}

function adjustLineHeight(amount) {
    saveReadingPosition();

    let next =
        Math.round((currentLineHeight + amount) * 10) / 10;

    if (next >= 1.0 && next <= 100.0) {
        currentLineHeight = next;
        applyLineHeight();

        setTimeout(() => {
            restoreReadingPosition();
        }, 100);
    }
}

/* ==
   LETTER SPACING SYSTEM
== */
function applyLetterSpacing() {
    const content = document.getElementById('reading-content');

    if (content) {
        content.style.letterSpacing =
            currentLetterSpacing + 'px';
    }

    const lsDisplay = document.getElementById('ls-display');
    if (lsDisplay) {
        lsDisplay.innerText = currentLetterSpacing;
    }

    localStorage.setItem('userLetterSpacing', currentLetterSpacing);
}

function adjustLetterSpacing(amount) {
    saveReadingPosition();

    let next =
        Math.round((currentLetterSpacing + amount) * 10) / 10;

    if (next >= 0 && next <= 10) {
        currentLetterSpacing = next;
        applyLetterSpacing();

        setTimeout(() => {
            restoreReadingPosition();
        }, 100);
    }
}

/* ==
   TOC SEARCH
== */
function clearTOCSearch() {
    const tocSearch = document.getElementById('toc-search');
    const tocItems = document.querySelectorAll('.toc-list li');

    if (tocSearch) tocSearch.value = '';

    tocItems.forEach(item => {
        item.style.display = 'block';
    });
}

/* ==
   MAIN INIT
== */
function init() {
    const article = document.querySelector('article');

    const tocSearch = document.getElementById('toc-search');
    const tocItems = document.querySelectorAll('.toc-list li');

    const savedLH = localStorage.getItem('userLineHeight');
    if (savedLH !== null) {
        currentLineHeight = parseFloat(savedLH);
    }

    applyLineHeight();

    const savedLS = localStorage.getItem('userLetterSpacing');
    if (savedLS !== null) {
        currentLetterSpacing = parseFloat(savedLS);
    }

    applyLetterSpacing();

    saveCurrentPage();
    showLastReadLink();

    buildSemanticParagraphs();
    restoreReadingPosition();

    let readingTimer;

    window.addEventListener('scroll', () => {
        clearTimeout(readingTimer);
        readingTimer = setTimeout(() => {
            saveReadingPosition();
        }, 200);
    });

    /* TOC observer */
    const sections = document.querySelectorAll('section');
    const tocLinks = document.querySelectorAll('.toc-list li a');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');

                tocLinks.forEach(link => {
                    link.classList.remove('active-chapter');

                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active-chapter');
                        localStorage.setItem('lastReadChapter', id);
                    }
                });
            }
        });
    }, {
        root: null,
        rootMargin: '-10% 0px -70% 0px',
        threshold: 0
    });

    sections.forEach(section => observer.observe(section));

    /* buttons */
    document.querySelectorAll('.line-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentLineHeight = parseFloat(btn.dataset.value);
            applyLineHeight();
        });
    });

    document.querySelectorAll('.letter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentLetterSpacing = parseFloat(btn.dataset.value);
            applyLetterSpacing();
        });
    });

    /* font size */
    let fontSize =
        parseInt(localStorage.getItem('userFontSize')) || 25;

    function renderFontSize() {
        const articleElement = document.querySelector('article');

        if (articleElement) {
            articleElement.style.fontSize = fontSize + 'px';
        }

        localStorage.setItem('userFontSize', fontSize);
    }

    function changeFontSize(amount) {
        saveReadingPosition();

        const next = fontSize + amount;

        if (next >= 10 && next <= 70) {
            fontSize = next;
            renderFontSize();

            setTimeout(() => {
                restoreReadingPosition();
            }, 100);
        }
    }

    document.getElementById('font-increase')?.addEventListener('click', () => changeFontSize(1));
    document.getElementById('font-decrease')?.addEventListener('click', () => changeFontSize(-1));
    document.getElementById('size-plus-10')?.addEventListener('click', () => changeFontSize(10));
    document.getElementById('size-minus-10')?.addEventListener('click', () => changeFontSize(-10));
    document.getElementById('size-plus-1')?.addEventListener('click', () => changeFontSize(1));
    document.getElementById('size-minus-1')?.addEventListener('click', () => changeFontSize(-1));

    renderFontSize();

    /* font weight */
    let currentWeight =
        parseInt(localStorage.getItem('userFontWeight')) || 500;

    const weightButtons =
        document.querySelectorAll('#weight-buttons .preset-btn');

    function renderWeight() {
        const articleElement = document.querySelector('article');

        if (articleElement) {
            articleElement.style.fontWeight = currentWeight;
        }

        localStorage.setItem('userFontWeight', currentWeight);

        weightButtons.forEach(btn => {
            btn.classList.toggle(
                'active-preset',
                parseInt(btn.dataset.weight) === currentWeight
            );
        });
    }

    function changeWeight(amount) {
        const next = currentWeight + amount;

        if (next >= 100 && next <= 900) {
            currentWeight = next;
            renderWeight();
        }
    }

    weightButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentWeight = parseInt(btn.dataset.weight);
            renderWeight();
        });
    });

    renderWeight();

    /* export */
    window.toggleTOC = toggleTOC;
    window.toggleSetting = toggleSetting;
    window.downloadPDF = downloadPDF;
    window.toggleReadingMode = toggleReadingMode;
    window.adjustLineHeight = adjustLineHeight;
    window.adjustLetterSpacing = adjustLetterSpacing;
}

/* ==
   DOM READY
== */
document.addEventListener('DOMContentLoaded', init);

})();
