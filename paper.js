(() => {
'use strict';

/* =========================
   GLOBAL STATE
========================= */

let currentLineHeight = 2.0;
let currentLetterSpacing = 0;


/* ========================= SEMANTIC SYSTEM ========================= */
function buildSemanticParagraphs() {
    const containers = document.querySelectorAll('.raw-text');
    let globalIndex = 1;

    containers.forEach((container) => {
        const rawText = container.innerText.trim();

        const paragraphs = rawText
            .split(/\n\s*\n/)
            .filter(p => p.trim() !== '');

        container.innerHTML = '';

        paragraphs.forEach((text) => {
            const p = document.createElement('p');

            p.setAttribute('data-p', globalIndex);
            p.textContent = text.trim();

            container.appendChild(p);
            globalIndex++;
        });
    });
}

function saveReadingPosition() {
    const paragraphs = document.querySelectorAll('.raw-text p');

    let currentParagraph = null;

    paragraphs.forEach(p => {
        const rect = p.getBoundingClientRect();

        if (
            rect.top >= 0 &&
            rect.top < window.innerHeight * 0.35
        ) {
            currentParagraph = p.dataset.p;
        }
    });

    if (currentParagraph) {
        localStorage.setItem(
            'readingPosition',
            JSON.stringify({
                paragraph: currentParagraph
            })
        );
    }
}

function restoreReadingPosition() {
    const saved = localStorage.getItem('readingPosition');

    if (!saved) return;

    const data = JSON.parse(saved);

    setTimeout(() => {
        const target = document.querySelector(
            `[data-p="${data.paragraph}"]`
        );

        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }, 600);
}
/* =================================================================== */


/* =========================
   TOGGLE SYSTEM
========================= */

function toggleTOC() {
    const tocOverlay =
        document.getElementById('toc-overlay');

    if (!tocOverlay) return;

    const isOpening =
        tocOverlay.style.display !== 'block';

    if (isOpening) {

        tocOverlay.style.display = 'block';

        setTimeout(() => {
            const activeItem =
                document.querySelector(
                    '.active-chapter'
                );

            const tocList =
                document.querySelector('.toc-list');

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
    const settingOverlay =
        document.getElementById('setting-overlay');

    if (!settingOverlay) return;

    const isVisible =
        settingOverlay.style.display === 'block';

    settingOverlay.style.display =
        isVisible ? 'none' : 'block';
}

function downloadPDF() {
    toggleSetting();

    setTimeout(() => {
        window.print();
    }, 500);
}

function toggleReadingMode() {

    document.body.classList.toggle('focus-mode');

    const fsBtn =
        document.getElementById('fs-btn');

    if (
        document.body.classList.contains(
            'focus-mode'
        )
    ) {
        fsBtn.innerHTML = '✖';

        fsBtn.style.background =
            'rgba(234, 222, 188, 0.2)';

    } else {

        fsBtn.innerHTML = '⛶';

        fsBtn.style.background =
            'rgba(234, 222, 188, 0.4)';
    }
}


/* =========================
   LAST READ SYSTEM
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
        localStorage.getItem('lastReadTitle');

    const lastUrl =
        localStorage.getItem('lastReadUrl');

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
            <div style="background: #eadebc; border: 1px solid #443300; padding: 15px; margin: 10px; border-radius: 8px; text-align:center;">
                <p style="color: #443300; font-size: 14px; margin-bottom: 5px;">
                    သင်နောက်ဆုံး ဖတ်လက်စအပိုင်း -
                </p>

                <a
                    href="${lastUrl}"
                    style="color: #443300; font-weight: bold; text-decoration: none;"
                >
                    📖 ${lastTitle} သို့ ပြန်သွားရန်
                </a>
            </div>
        `;
    }
}


/* =========================
   LINE HEIGHT SYSTEM
========================= */

function applyLineHeight() {

    const content =
        document.getElementById('reading-content');

    if (content) {
        content.style.lineHeight =
            currentLineHeight;
    }

    document.getElementById('lh-display')
        .innerText =
        currentLineHeight.toFixed(1);

    const lineButtons =
        document.querySelectorAll('.line-btn');

    lineButtons.forEach(btn => {

        btn.classList.remove('active-preset');

        if (
            parseFloat(btn.dataset.value)
            === currentLineHeight
        ) {
            btn.classList.add('active-preset');
        }
    });

    localStorage.setItem(
        'userLineHeight',
        currentLineHeight
    );
}

function adjustLineHeight(amount) {

    let next =
        Math.round(
            (currentLineHeight + amount) * 10
        ) / 10;

    if (next >= 1.0 && next <= 3.0) {

        currentLineHeight = next;

        applyLineHeight();
    }
}


/* =========================
   LETTER SPACING SYSTEM
========================= */

function applyLetterSpacing() {

    const content =
        document.getElementById('reading-content');

    if (content) {
        content.style.letterSpacing =
            currentLetterSpacing + 'px';
    }

    document.getElementById('ls-display')
        .innerText = currentLetterSpacing;

    const letterButtons =
        document.querySelectorAll('.letter-btn');

    letterButtons.forEach(btn => {

        btn.classList.remove('active-preset');

        if (
            parseFloat(btn.dataset.value)
            === currentLetterSpacing
        ) {
            btn.classList.add('active-preset');
        }
    });

    localStorage.setItem(
        'userLetterSpacing',
        currentLetterSpacing
    );
}

function adjustLetterSpacing(amount) {

    let next =
        Math.round(
            (currentLetterSpacing + amount) * 10
        ) / 10;

    if (next >= 0 && next <= 10) {

        currentLetterSpacing = next;

        applyLetterSpacing();
    }
}


/* =========================
   TOC SEARCH
========================= */

function clearTOCSearch() {

    const tocSearch =
        document.getElementById('toc-search');

    const tocItems =
        document.querySelectorAll('.toc-list li');

    tocSearch.value = '';

    tocItems.forEach(item => {
        item.style.display = 'block';
    });
}


/* =========================
   MAIN INIT
========================= */

function init() {

    const article =
        document.querySelector('article');

    const tocSearch =
        document.getElementById('toc-search');

    const tocItems =
        document.querySelectorAll('.toc-list li');


    /* ===== LOAD SAVED SETTINGS ===== */

    const savedLH =
        localStorage.getItem('userLineHeight');

    if (savedLH !== null) {
        currentLineHeight = parseFloat(savedLH);
    }

    applyLineHeight();


    const savedLS =
        localStorage.getItem('userLetterSpacing');

    if (savedLS !== null) {
        currentLetterSpacing = parseFloat(savedLS);
    }

    applyLetterSpacing();


    /* ===== LAST READ ===== */

    saveCurrentPage();
    showLastReadLink();


    /* ===== SEMANTIC ===== */

    buildSemanticParagraphs();
    restoreReadingPosition();


    let readingTimer;

    window.addEventListener('scroll', () => {

        clearTimeout(readingTimer);

        readingTimer = setTimeout(() => {
            saveReadingPosition();
        }, 200);
    });


    /* ===== TOC ACTIVE ===== */

    const sections =
        document.querySelectorAll('section');

    const tocLinks =
        document.querySelectorAll('.toc-list li a');

    const observerOptions = {
        root: null,
        rootMargin: '-10% 0px -70% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver(
        (entries) => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    const id =
                        entry.target.getAttribute('id');

                    tocLinks.forEach(link => {

                        link.classList.remove(
                            'active-chapter'
                        );

                        if (
                            link.getAttribute('href')
                            === `#${id}`
                        ) {
                            link.classList.add(
                                'active-chapter'
                            );

                            localStorage.setItem(
                                'lastReadChapter',
                                id
                            );
                        }
                    });
                }
            });
        },
        observerOptions
    );

    sections.forEach(section => {
        observer.observe(section);
    });


    /* ===== TOC SEARCH ===== */

    if (tocSearch) {

        tocSearch.addEventListener('input', () => {

            const searchText =
                tocSearch.value.toLowerCase();

            tocItems.forEach(item => {

                const text =
                    item.textContent.toLowerCase();

                item.style.display =
                    text.includes(searchText)
                    ? 'block'
                    : 'none';
            });
        });
    }


    /* ===== LONG PRESS SELECT ===== */

    let timer;
    let isLongPressed = false;
    let startX, startY;

    if (article) {

        article.addEventListener('touchstart', e => {

            isLongPressed = false;

            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;

            timer = setTimeout(() => {

                isLongPressed = true;

                article.style.webkitUserSelect = 'text';
                article.style.userSelect = 'text';

            }, 500);
        });


        article.addEventListener('touchmove', e => {

            let moveX = e.touches[0].clientX;
            let moveY = e.touches[0].clientY;

            if (
                Math.abs(moveX - startX) > 10 ||
                Math.abs(moveY - startY) > 10
            ) {
                clearTimeout(timer);
            }
        });


        article.addEventListener('touchend', () => {

            clearTimeout(timer);

            if (!isLongPressed) {

                if (
                    window.getSelection().toString()
                    === ''
                ) {
                    article.style.webkitUserSelect = 'none';
                    article.style.userSelect = 'none';
                }
            }
        });
    }
}


/* =========================
   SINGLE DOMCONTENTLOADED
========================= */

document.addEventListener(
    'DOMContentLoaded',
    init
);


/* =========================
   EXPORT FUNCTIONS
========================= */

window.toggleTOC = toggleTOC;
window.toggleSetting = toggleSetting;
window.downloadPDF = downloadPDF;
window.toggleReadingMode = toggleReadingMode;
window.adjustLineHeight = adjustLineHeight;
window.adjustLetterSpacing = adjustLetterSpacing;

})();
