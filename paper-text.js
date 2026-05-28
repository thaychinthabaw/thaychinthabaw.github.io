(() => {
'use strict';

/* ==
   TEXT READER ENGINE
== */
const TEXT = {
    /* ==
       STATE
    == */
    state: {
        fontSize: 25,
        lineHeight: 2.0,
        letterSpacing: 0,
        fontWeight: 500
    },
    /* ==
       DOM
    == */
    dom: {},
    /* ==
       INIT
    == */
    init() {
        this.cacheDOM();
        this.loadSettings();
        this.buildSemanticParagraphs();
        this.restoreReadingPosition();
        this.bindEvents();
        this.observeSections();
        this.saveCurrentPage();
        this.showLastReadLink();
    },
    /* ==
       DOM CACHE
    == */
    cacheDOM() {
        const $ = (id) => document.getElementById(id);
        this.dom = {
            article: document.querySelector('article'),
            content: $('reading-content'),
            tocOverlay: $('toc-overlay'),
            settingOverlay: $('setting-overlay'),
            tocSearch: $('toc-search')
        };
    },
    /* ==
       STORAGE
    == */
    save(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
    load(key, fallback) {
        const value = localStorage.getItem(key);
        if (value === null) return fallback;
        try { return JSON.parse(value); } catch { return fallback; }
    },
    /* ==
       SEMANTIC SYSTEM
    == */
    buildSemanticParagraphs() {
        const containers = document.querySelectorAll('.raw-text');
        let globalIndex = 1;
        containers.forEach(container => {
            const rawText = container.textContent.trim();
            const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim() !== '');
            container.innerHTML = '';
            paragraphs.forEach(text => {
                const clean = text.trim();
                /* GAP */
                if (clean === '@@gap') {
                    const gap = document.createElement('div');
                    gap.className = 'big-gap';
                    container.appendChild(gap);
                    return;
                }
                /* PARAGRAPH */
                const p = document.createElement('p');
                p.dataset.p = globalIndex;
                p.textContent = clean;
                container.appendChild(p);
                globalIndex++;
            });
        });
    },
    /* ==
       READING POSITION
    == */
    saveReadingPosition() {
        const paragraphs = document.querySelectorAll('.raw-text p');
        let current = null;
        let ratio = 0;
        paragraphs.forEach(p => {
            const rect = p.getBoundingClientRect();
            if (rect.top <= window.innerHeight * 0.35 && rect.bottom > 0) {
                current = p.dataset.p;
                ratio = Math.abs(rect.top) / rect.height;
            }
        });
        if (!current) return;
        this.save('readingPosition', { paragraph: current, ratio });
    },
    restoreReadingPosition() {
        const data = this.load('readingPosition', null);
        if (!data) return;
        setTimeout(() => {
            const target = document.querySelector(`[data-p="${data.paragraph}"]`);
            if (!target) return;
            const offset = target.offsetHeight * data.ratio;
            window.scrollTo({ top: target.offsetTop + offset - 120, behavior: 'smooth' });
        }, 600);
    },
    /* ==
       TYPOGRAPHY
    == */
    renderTypography() {
        const article = this.dom.article;
        if (!article) return;
        article.style.fontSize = this.state.fontSize + 'px';
        article.style.lineHeight = this.state.lineHeight;
        article.style.letterSpacing = this.state.letterSpacing + 'px';
        article.style.fontWeight = this.state.fontWeight;
    },
    loadSettings() {
        this.state.fontSize = this.load('fontSize', 25);
        this.state.lineHeight = this.load('lineHeight', 2);
        this.state.letterSpacing = this.load('letterSpacing', 0);
        this.state.fontWeight = this.load('fontWeight', 500);
        this.renderTypography();
    },
    changeFontSize(amount) {
        this.saveReadingPosition();
        this.state.fontSize += amount;
        if (this.state.fontSize < 10) this.state.fontSize = 10;
        if (this.state.fontSize > 70) this.state.fontSize = 70;
        this.renderTypography();
        this.save('fontSize', this.state.fontSize);
        setTimeout(() => { this.restoreReadingPosition(); }, 100);
    },
    changeLineHeight(amount) {
        this.saveReadingPosition();
        this.state.lineHeight += amount;
        this.state.lineHeight = parseFloat(this.state.lineHeight.toFixed(1));
        if (this.state.lineHeight < 1) this.state.lineHeight = 1;
        if (this.state.lineHeight > 5) this.state.lineHeight = 5;
        this.renderTypography();
        this.save('lineHeight', this.state.lineHeight);
        setTimeout(() => { this.restoreReadingPosition(); }, 100);
    },
    changeLetterSpacing(amount) {
        this.saveReadingPosition();
        this.state.letterSpacing += amount;
        this.state.letterSpacing = parseFloat(this.state.letterSpacing.toFixed(1));
        if (this.state.letterSpacing < 0) this.state.letterSpacing = 0;
        if (this.state.letterSpacing > 10) this.state.letterSpacing = 10;
        this.renderTypography();
        this.save('letterSpacing', this.state.letterSpacing);
        setTimeout(() => { this.restoreReadingPosition(); }, 100);
    },
    changeFontWeight(amount) {
        this.state.fontWeight += amount;
        if (this.state.fontWeight < 100) this.state.fontWeight = 100;
        if (this.state.fontWeight > 900) this.state.fontWeight = 900;
        this.renderTypography();
        this.save('fontWeight', this.state.fontWeight);
    },
    /* ==
       TOC
    == */
    toggleTOC() {
        const toc = this.dom.tocOverlay;
        if (!toc) return;
        toc.style.display = toc.style.display === 'block' ? 'none' : 'block';
    },
    clearTOCSearch() {
        const items = document.querySelectorAll('.toc-list li');
        this.dom.tocSearch.value = '';
        items.forEach(item => { item.style.display = 'block'; });
    },
    observeSections() {
        const sections = document.querySelectorAll('section');
        const tocLinks = document.querySelectorAll('.toc-list li a');
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const id = entry.target.id;
                tocLinks.forEach(link => {
                    link.classList.remove('active-chapter');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active-chapter');
                    }
                });
            });
        }, { rootMargin: '-10% 0px -70% 0px' });
        sections.forEach(section => observer.observe(section));
    },
    /* ==
       SETTING
    == */
    toggleSetting() {
        const setting = this.dom.settingOverlay;
        if (!setting) return;
        setting.style.display = setting.style.display === 'block' ? 'none' : 'block';
    },
    toggleFocusMode() { document.body.classList.toggle('focus-mode'); },
    /* ==
       LAST READ
    == */
    saveCurrentPage() {
        localStorage.setItem('lastReadTitle', document.title);
        localStorage.setItem('lastReadUrl', location.href);
    },
    showLastReadLink() {
        const title = localStorage.getItem('lastReadTitle');
        const url = localStorage.getItem('lastReadUrl');
        const box = document.getElementById('last-read-container');
        if (!title || !url || !box) return;
        if (location.href === url) return;
        box.innerHTML = `<div class="last-read-box"><a href="${url}">📖 ${title}</a></div>`;
    },
    /* ==
       EVENTS
    == */
    bindEvents() {
        /* SAVE POSITION */
        let timer;
        window.addEventListener('scroll', () => {
            clearTimeout(timer);
            timer = setTimeout(() => { this.saveReadingPosition(); }, 200);
        });
        /* TOC SEARCH */
        if (this.dom.tocSearch) {
            this.dom.tocSearch.addEventListener('input', () => {
                const text = this.dom.tocSearch.value.toLowerCase();
                const items = document.querySelectorAll('.toc-list li');
                items.forEach(item => {
                    item.style.display = item.textContent.toLowerCase().includes(text) ? 'block' : 'none';
                });
            });
        }
        /* LONG PRESS SELECT */
        let pressTimer;
        let startX, startY;
        this.dom.article?.addEventListener('touchstart', e => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            pressTimer = setTimeout(() => { this.dom.article.style.userSelect = 'text'; }, 500);
        });
        this.dom.article?.addEventListener('touchmove', e => {
            const moveX = e.touches[0].clientX;
            const moveY = e.touches[0].clientY;
            if (Math.abs(moveX - startX) > 10 || Math.abs(moveY - startY) > 10) { clearTimeout(pressTimer); }
        });
        this.dom.article?.addEventListener('touchend', () => { clearTimeout(pressTimer); });
    }
};

/* ==
   FULLSCREEN SYSTEM
== */
function toggleFullscreen() {
    const doc = document.documentElement;
    if (!document.fullscreenElement) {
        if (doc.requestFullscreen) { doc.requestFullscreen(); }
        else if (doc.webkitRequestFullscreen) { doc.webkitRequestFullscreen(); }
    } else {
        if (document.exitFullscreen) { document.exitFullscreen(); }
    }
}

/* ==
   GLOBAL EXPORT
== */
window.TEXT = TEXT;
window.toggleTOC = () => TEXT.toggleTOC();
window.toggleSetting = () => TEXT.toggleSetting();
window.toggleFocusMode = () => TEXT.toggleFocusMode();
window.toggleFullscreen = toggleFullscreen;
// HTML compatibility (paper.js style alias)
window.toggleReadingMode = () => {
    TEXT.toggleFocusMode();
};
/* ==
   START
== */
document.addEventListener('DOMContentLoaded', () => {
    TEXT.init();

    // FS BUTTON (မင်း HTML က (() => {
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

})(); ဖြစ်လို့ပြင်)
    const fullscreenBtn = document.getElementById('fs-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
});
})();
