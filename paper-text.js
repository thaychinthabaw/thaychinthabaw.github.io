paper-text.js

(() => {
'use strict';

/* =========================
   GLOBAL STATE
========================= */

window.currentLineHeight = 2.0;
window.currentLetterSpacing = 0;

/* =========================
   SEMANTIC SYSTEM
========================= */

window.buildSemanticParagraphs = function () {

    const containers =
    document.querySelectorAll('.raw-text');

    let globalIndex = 1;

    containers.forEach((container) => {

        const rawText =
        container.textContent.trim();

        const paragraphs =
        rawText
        .split(/\n\s*\n/)
        .filter(p => p.trim() !== '');

        container.innerHTML = '';

        paragraphs.forEach((text) => {

            const cleanText =
            text.trim();

            if (cleanText === '@@gap') {

                const gap =
                document.createElement('div');

                gap.className = 'big-gap';

                container.appendChild(gap);

                return;
            }

            const p =
            document.createElement('p');

            p.setAttribute(
                'data-p',
                globalIndex
            );

            p.textContent =
            cleanText;

            container.appendChild(p);

            globalIndex++;
        });
    });
};

/* =========================
   SAVE POSITION
========================= */

window.saveReadingPosition = function () {

    const paragraphs =
    document.querySelectorAll('.raw-text p');

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
            /
            rect.height;
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
};

/* =========================
   RESTORE POSITION
========================= */

window.restoreReadingPosition = function () {

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
        *
        (data.offsetRatio || 0);

        const absoluteTop =
        target.offsetTop;

        const finalY =
        absoluteTop
        +
        offset
        -
        120;

        window.scrollTo({
            top: finalY,
            behavior: 'smooth'
        });

    }, 600);
};

/* =========================
   LINE HEIGHT
========================= */

window.applyLineHeight = function () {

    const content =
    document.getElementById(
        'reading-content'
    );

    if (content) {

        content.style.lineHeight =
        currentLineHeight;
    }

    localStorage.setItem(
        'userLineHeight',
        currentLineHeight
    );
};

window.adjustLineHeight = function (amount) {

    saveReadingPosition();

    let next =
    Math.round(
        (currentLineHeight + amount) * 10
    ) / 10;

    if (next >= 1 && next <= 100) {

        currentLineHeight = next;

        applyLineHeight();

        setTimeout(() => {

            restoreReadingPosition();

        }, 100);
    }
};

/* =========================
   LETTER SPACING
========================= */

window.applyLetterSpacing = function () {

    const content =
    document.getElementById(
        'reading-content'
    );

    if (content) {

        content.style.letterSpacing =
        currentLetterSpacing + 'px';
    }

    localStorage.setItem(
        'userLetterSpacing',
        currentLetterSpacing
    );
};

window.adjustLetterSpacing = function (amount) {

    saveReadingPosition();

    let next =
    Math.round(
        (currentLetterSpacing + amount) * 10
    ) / 10;

    if (next >= 0 && next <= 10) {

        currentLetterSpacing = next;

        applyLetterSpacing();

        setTimeout(() => {

            restoreReadingPosition();

        }, 100);
    }
};

})();
