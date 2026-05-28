(() => {
'use strict';

/* =========================================
   TEXT.JS
   Standalone Reading System
========================================= */

/* =========================================
   GLOBAL STATE
========================================= */
const state = {
    fontSize: parseInt(
        localStorage.getItem('userFontSize')
    ) || 25,

    lineHeight: parseFloat(
        localStorage.getItem('userLineHeight')
    ) || 2.0,

    letterSpacing: parseFloat(
        localStorage.getItem('userLetterSpacing')
    ) || 0,

    fontWeight: parseInt(
        localStorage.getItem('userFontWeight')
    ) || 500
};

/* =========================================
   SEMANTIC PARAGRAPH SYSTEM
========================================= */
function buildSemanticParagraphs() {

    const containers =
        document.querySelectorAll('.raw-text');

    let globalIndex = 1;

    containers.forEach(container => {

        const rawText =
            container.textContent.trim();

        const paragraphs =
            rawText
            .split(/\n\s*\n/)
            .filter(
                p => p.trim() !== ''
            );

        container.innerHTML = '';

        paragraphs.forEach(text => {

            const cleanText =
                text.trim();

            /* GAP SYSTEM */
            if (cleanText === '@@gap') {

                const gap =
                    document.createElement('div');

                gap.className = 'big-gap';

                container.appendChild(gap);

                return;
            }

            /* PARAGRAPH */
            const p =
                document.createElement('p');

            p.dataset.p = globalIndex;

            p.textContent = cleanText;

            container.appendChild(p);

            globalIndex++;
        });
    });
}

/* =========================================
   SAVE READING POSITION
========================================= */
function saveReadingPosition() {

    const paragraphs =
        document.querySelectorAll(
            '.raw-text p'
        );

    let currentParagraph = null;

    let offsetRatio = 0;

    paragraphs.forEach(p => {

        const rect =
            p.getBoundingClientRect();

        if (
            rect.top <= window.innerHeight * 0.35 &&
            rect.bottom > 0
        ) {

            currentParagraph =
                p.dataset.p;

            offsetRatio =
                Math.abs(rect.top)
                / rect.height;
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

/* =========================================
   RESTORE READING POSITION
========================================= */
function restoreReadingPosition() {

    const saved =
        localStorage.getItem(
            'readingPosition'
        );

    if (!saved) return;

    let data;

    try {

        data = JSON.parse(saved);

    } catch {

        return;
    }

    setTimeout(() => {

        const target =
            document.querySelector(
                `[data-p="${data.paragraph}"]`
            );

        if (!target) return;

        const paragraphHeight =
            target.offsetHeight;

        const offset =
            paragraphHeight
            * (data.offsetRatio || 0);

        const finalY =
            target.offsetTop
            + offset
            - 120;

        window.scrollTo({
            top: finalY,
            behavior: 'smooth'
        });

    }, 500);
}

/* =========================================
   APPLY TYPOGRAPHY
========================================= */
function applyTypography() {

    const article =
        document.querySelector('article');

    if (!article) return;

    article.style.fontSize =
        state.fontSize + 'px';

    article.style.lineHeight =
        state.lineHeight;

    article.style.letterSpacing =
        state.letterSpacing + 'px';

    article.style.fontWeight =
        state.fontWeight;
}

/* =========================================
   FONT SIZE
========================================= */
function changeFontSize(amount) {

    saveReadingPosition();

    const next =
        state.fontSize + amount;

    if (next >= 10 && next <= 70) {

        state.fontSize = next;

        localStorage.setItem(
            'userFontSize',
            state.fontSize
        );

        applyTypography();

        setTimeout(() => {
            restoreReadingPosition();
        }, 100);
    }
}

/* =========================================
   LINE HEIGHT
========================================= */
function changeLineHeight(amount) {

    saveReadingPosition();

    let next =
        Math.round(
            (state.lineHeight + amount) * 10
        ) / 10;

    if (next >= 1 && next <= 5) {

        state.lineHeight = next;

        localStorage.setItem(
            'userLineHeight',
            state.lineHeight
        );

        applyTypography();

        setTimeout(() => {
            restoreReadingPosition();
        }, 100);
    }
}

/* =========================================
   LETTER SPACING
========================================= */
function changeLetterSpacing(amount) {

    saveReadingPosition();

    let next =
        Math.round(
            (
                state.letterSpacing
                + amount
            ) * 10
        ) / 10;

    if (next >= 0 && next <= 10) {

        state.letterSpacing = next;

        localStorage.setItem(
            'userLetterSpacing',
            state.letterSpacing
        );

        applyTypography();

        setTimeout(() => {
            restoreReadingPosition();
        }, 100);
    }
}

/* =========================================
   FONT WEIGHT
========================================= */
function changeFontWeight(amount) {

    const next =
        state.fontWeight + amount;

    if (next >= 100 && next <= 900) {

        state.fontWeight = next;

        localStorage.setItem(
            'userFontWeight',
            state.fontWeight
        );

        applyTypography();
    }
}

/* =========================================
   READING MODE
========================================= */
function toggleReadingMode() {

    document.body.classList.toggle(
        'focus-mode'
    );
}

/* =========================================
   LAST READ SYSTEM
========================================= */
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

    const container =
        document.getElementById(
            'last-read-container'
        );

    if (
        !lastTitle ||
        !lastUrl ||
        !container
    ) {
        return;
    }

    if (
        window.location.href === lastUrl
    ) {
        return;
    }

    container.innerHTML = `
        <div class="last-read-box">
            <p>
                သင်နောက်ဆုံးဖတ်ခဲ့သောစာ
            </p>

            <a href="${lastUrl}">
                📖 ${lastTitle}
            </a>
        </div>
    `;
}

/* =========================================
   TOC ACTIVE SYSTEM
========================================= */
function initTOCObserver() {

    const sections =
        document.querySelectorAll('section');

    const tocLinks =
        document.querySelectorAll(
            '.toc-list li a'
        );

    const observer =
        new IntersectionObserver(

            entries => {

                entries.forEach(entry => {

                    if (
                        !entry.isIntersecting
                    ) {
                        return;
                    }

                    const id =
                        entry.target.id;

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
                        }
                    });
                });
            },

            {
                root: null,
                rootMargin:
                    '-10% 0px -70% 0px',
                threshold: 0
            }
        );

    sections.forEach(section => {
        observer.observe(section);
    });
}

/* =========================================
   TOC SEARCH
========================================= */
function initTOCSearch() {

    const search =
        document.getElementById(
            'toc-search'
        );

    if (!search) return;

    const items =
        document.querySelectorAll(
            '.toc-list li'
        );

    search.addEventListener(
        'input',

        () => {

            const text =
                search.value.toLowerCase();

            items.forEach(item => {

                item.style.display =
                    item.textContent
                    .toLowerCase()
                    .includes(text)
                    ? 'block'
                    : 'none';
            });
        }
    );
}

/* =========================================
   LONG PRESS SELECT
========================================= */
function initLongPressSelect() {

    const article =
        document.querySelector('article');

    if (!article) return;

    let timer;

    let startX = 0;

    let startY = 0;

    article.addEventListener(
        'touchstart',

        e => {

            startX =
                e.touches[0].clientX;

            startY =
                e.touches[0].clientY;

            timer = setTimeout(() => {

                article.style.userSelect =
                    'text';

                article.style.webkitUserSelect =
                    'text';

            }, 500);
        }
    );

    article.addEventListener(
        'touchmove',

        e => {

            const moveX =
                e.touches[0].clientX;

            const moveY =
                e.touches[0].clientY;

            if (
                Math.abs(moveX - startX) > 10 ||
                Math.abs(moveY - startY) > 10
            ) {

                clearTimeout(timer);
            }
        }
    );

    article.addEventListener(
        'touchend',

        () => {

            clearTimeout(timer);

            if (
                window.getSelection()
                .toString() === ''
            ) {

                article.style.userSelect =
                    'none';

                article.style.webkitUserSelect =
                    'none';
            }
        }
    );
}

/* =========================================
   AUTO SAVE SCROLL
========================================= */
function initScrollSaver() {

    let timer;

    window.addEventListener(
        'scroll',

        () => {

            clearTimeout(timer);

            timer = setTimeout(() => {

                saveReadingPosition();

            }, 200);
        }
    );
}

/* =========================================
   INIT
========================================= */
function init() {

    buildSemanticParagraphs();

    applyTypography();

    restoreReadingPosition();

    saveCurrentPage();

    showLastReadLink();

    initTOCObserver();

    initTOCSearch();

    initLongPressSelect();

    initScrollSaver();
}

/* =========================================
   EXPORT
========================================= */
window.textSystem = {

    changeFontSize,

    changeLineHeight,

    changeLetterSpacing,

    changeFontWeight,

    toggleReadingMode,

    saveReadingPosition,

    restoreReadingPosition
};

/* =========================================
   START
========================================= */
document.addEventListener(
    'DOMContentLoaded',
    init
);

})();
