(() => {
'use strict';

/* =========================================
   UI.JS
   Standalone UI System
========================================= */

/* =========================================
   TOGGLE TOC
========================================= */
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

        setTimeout(() => {

            const activeItem =
                document.querySelector(
                    '.active-chapter'
                );

            if (activeItem) {

                activeItem.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }

        }, 100);

    } else {

        tocOverlay.style.display =
            'none';

        clearTOCSearch();
    }
}

/* =========================================
   TOGGLE SETTING
========================================= */
function toggleSetting() {

    const overlay =
        document.getElementById(
            'setting-overlay'
        );

    if (!overlay) return;

    const isVisible =
        overlay.style.display === 'block';

    overlay.style.display =
        isVisible
        ? 'none'
        : 'block';
}

/* =========================================
   DOWNLOAD PDF
========================================= */
function downloadPDF() {

    toggleSetting();

    setTimeout(() => {

        window.print();

    }, 500);
}

/* =========================================
   CLEAR TOC SEARCH
========================================= */
function clearTOCSearch() {

    const search =
        document.getElementById(
            'toc-search'
        );

    const items =
        document.querySelectorAll(
            '.toc-list li'
        );

    if (search) {
        search.value = '';
    }

    items.forEach(item => {

        item.style.display =
            'block';
    });
}

/* =========================================
   FONT SIZE UI
========================================= */
function updateFontSizeUI() {

    const size =
        parseInt(
            localStorage.getItem(
                'userFontSize'
            )
        ) || 25;

    const display =
        document.getElementById(
            'font-size-display'
        );

    const tens =
        document.getElementById(
            'size-tens'
        );

    const ones =
        document.getElementById(
            'size-ones'
        );

    if (display) {
        display.textContent = size;
    }

    if (tens) {
        tens.textContent =
            Math.floor(size / 10);
    }

    if (ones) {
        ones.textContent =
            size % 10;
    }
}

/* =========================================
   LINE HEIGHT UI
========================================= */
function updateLineHeightUI() {

    const value =
        parseFloat(
            localStorage.getItem(
                'userLineHeight'
            )
        ) || 2.0;

    const display =
        document.getElementById(
            'lh-display'
        );

    if (display) {
        display.innerText =
            value.toFixed(1);
    }

    const buttons =
        document.querySelectorAll(
            '.line-btn'
        );

    buttons.forEach(btn => {

        btn.classList.remove(
            'active-preset'
        );

        if (
            parseFloat(btn.dataset.value)
            === value
        ) {

            btn.classList.add(
                'active-preset'
            );
        }
    });
}

/* =========================================
   LETTER SPACING UI
========================================= */
function updateLetterSpacingUI() {

    const value =
        parseFloat(
            localStorage.getItem(
                'userLetterSpacing'
            )
        ) || 0;

    const display =
        document.getElementById(
            'ls-display'
        );

    if (display) {
        display.innerText = value;
    }

    const buttons =
        document.querySelectorAll(
            '.letter-btn'
        );

    buttons.forEach(btn => {

        btn.classList.remove(
            'active-preset'
        );

        if (
            parseFloat(btn.dataset.value)
            === value
        ) {

            btn.classList.add(
                'active-preset'
            );
        }
    });
}

/* =========================================
   FONT WEIGHT UI
========================================= */
function updateFontWeightUI() {

    const weight =
        parseInt(
            localStorage.getItem(
                'userFontWeight'
            )
        ) || 500;

    const hundreds =
        document.getElementById(
            'digit-hundreds'
        );

    const tens =
        document.getElementById(
            'digit-tens'
        );

    const ones =
        document.getElementById(
            'digit-ones'
        );

    if (hundreds) {

        hundreds.textContent =
            Math.floor(weight / 100);
    }

    if (tens) {

        tens.textContent =
            Math.floor(
                (weight % 100) / 10
            );
    }

    if (ones) {

        ones.textContent =
            weight % 10;
    }

    const buttons =
        document.querySelectorAll(
            '#weight-buttons .preset-btn'
        );

    buttons.forEach(btn => {

        btn.classList.toggle(
            'active-preset',

            parseInt(
                btn.dataset.weight
            ) === weight
        );
    });
}

/* =========================================
   TOC TOP / BOTTOM
========================================= */
function initTOCScrollButtons() {

    const topBtn =
        document.getElementById(
            'toc-top-btn'
        );

    const bottomBtn =
        document.getElementById(
            'toc-bottom-btn'
        );

    const tocContent =
        document.querySelector(
            '.toc-list'
        );

    if (
        topBtn &&
        tocContent
    ) {

        topBtn.addEventListener(
            'click',

            () => {

                tocContent.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        );
    }

    if (
        bottomBtn &&
        tocContent
    ) {

        bottomBtn.addEventListener(
            'click',

            () => {

                tocContent.scrollTo({
                    top: tocContent.scrollHeight,
                    behavior: 'smooth'
                });
            }
        );
    }
}

/* =========================================
   TOC SEARCH UI
========================================= */
function initTOCSearchUI() {

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
   FONT SIZE BUTTONS
========================================= */
function initFontButtons() {

    const plus =
        document.getElementById(
            'font-increase'
        );

    const minus =
        document.getElementById(
            'font-decrease'
        );

    const plus10 =
        document.getElementById(
            'size-plus-10'
        );

    const minus10 =
        document.getElementById(
            'size-minus-10'
        );

    const plus1 =
        document.getElementById(
            'size-plus-1'
        );

    const minus1 =
        document.getElementById(
            'size-minus-1'
        );

    if (plus) {

        plus.onclick = () => {

            window.textSystem
            .changeFontSize(1);

            updateFontSizeUI();
        };
    }

    if (minus) {

        minus.onclick = () => {

            window.textSystem
            .changeFontSize(-1);

            updateFontSizeUI();
        };
    }

    if (plus10) {

        plus10.onclick = () => {

            window.textSystem
            .changeFontSize(10);

            updateFontSizeUI();
        };
    }

    if (minus10) {

        minus10.onclick = () => {

            window.textSystem
            .changeFontSize(-10);

            updateFontSizeUI();
        };
    }

    if (plus1) {

        plus1.onclick = () => {

            window.textSystem
            .changeFontSize(1);

            updateFontSizeUI();
        };
    }

    if (minus1) {

        minus1.onclick = () => {

            window.textSystem
            .changeFontSize(-1);

            updateFontSizeUI();
        };
    }
}

/* =========================================
   LINE HEIGHT BUTTONS
========================================= */
function initLineButtons() {

    const buttons =
        document.querySelectorAll(
            '.line-btn'
        );

    buttons.forEach(btn => {

        btn.addEventListener(
            'click',

            () => {

                const value =
                    parseFloat(
                        btn.dataset.value
                    );

                const current =
                    parseFloat(
                        localStorage.getItem(
                            'userLineHeight'
                        )
                    ) || 2.0;

                const diff =
                    value - current;

                window.textSystem
                .changeLineHeight(diff);

                updateLineHeightUI();
            }
        );
    });
}

/* =========================================
   LETTER SPACING BUTTONS
========================================= */
function initLetterButtons() {

    const buttons =
        document.querySelectorAll(
            '.letter-btn'
        );

    buttons.forEach(btn => {

        btn.addEventListener(
            'click',

            () => {

                const value =
                    parseFloat(
                        btn.dataset.value
                    );

                const current =
                    parseFloat(
                        localStorage.getItem(
                            'userLetterSpacing'
                        )
                    ) || 0;

                const diff =
                    value - current;

                window.textSystem
                .changeLetterSpacing(diff);

                updateLetterSpacingUI();
            }
        );
    });
}

/* =========================================
   FONT WEIGHT BUTTONS
========================================= */
function initWeightButtons() {

    const presetButtons =
        document.querySelectorAll(
            '#weight-buttons .preset-btn'
        );

    presetButtons.forEach(btn => {

        btn.addEventListener(
            'click',

            () => {

                const target =
                    parseInt(
                        btn.dataset.weight
                    );

                const current =
                    parseInt(
                        localStorage.getItem(
                            'userFontWeight'
                        )
                    ) || 500;

                const diff =
                    target - current;

                window.textSystem
                .changeFontWeight(diff);

                updateFontWeightUI();
            }
        );
    });

    const plus100 =
        document.getElementById(
            'weight-plus-100'
        );

    const minus100 =
        document.getElementById(
            'weight-minus-100'
        );

    const plus10 =
        document.getElementById(
            'weight-plus-10'
        );

    const minus10 =
        document.getElementById(
            'weight-minus-10'
        );

    const plus1 =
        document.getElementById(
            'weight-plus-1'
        );

    const minus1 =
        document.getElementById(
            'weight-minus-1'
        );

    if (plus100) {

        plus100.onclick = () => {

            window.textSystem
            .changeFontWeight(100);

            updateFontWeightUI();
        };
    }

    if (minus100) {

        minus100.onclick = () => {

            window.textSystem
            .changeFontWeight(-100);

            updateFontWeightUI();
        };
    }

    if (plus10) {

        plus10.onclick = () => {

            window.textSystem
            .changeFontWeight(10);

            updateFontWeightUI();
        };
    }

    if (minus10) {

        minus10.onclick = () => {

            window.textSystem
            .changeFontWeight(-10);

            updateFontWeightUI();
        };
    }

    if (plus1) {

        plus1.onclick = () => {

            window.textSystem
            .changeFontWeight(1);

            updateFontWeightUI();
        };
    }

    if (minus1) {

        minus1.onclick = () => {

            window.textSystem
            .changeFontWeight(-1);

            updateFontWeightUI();
        };
    }
}

/* =========================================
   READING MODE BUTTON
========================================= */
function initReadingModeButton() {

    const fsBtn =
        document.getElementById(
            'fs-btn'
        );

    if (!fsBtn) return;

    fsBtn.addEventListener(
        'click',

        () => {

            window.textSystem
            .toggleReadingMode();

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
    );
}

/* =========================================
   INIT
========================================= */
function init() {

    updateFontSizeUI();

    updateLineHeightUI();

    updateLetterSpacingUI();

    updateFontWeightUI();

    initTOCScrollButtons();

    initTOCSearchUI();

    initFontButtons();

    initLineButtons();

    initLetterButtons();

    initWeightButtons();

    initReadingModeButton();
}

/* =========================================
   EXPORT
========================================= */
window.uiSystem = {

    toggleTOC,

    toggleSetting,

    downloadPDF,

    clearTOCSearch,

    updateFontSizeUI,

    updateLineHeightUI,

    updateLetterSpacingUI,

    updateFontWeightUI
};

/* =========================================
   START
========================================= */
document.addEventListener(
    'DOMContentLoaded',
    init
);

})();
