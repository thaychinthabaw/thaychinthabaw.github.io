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

/* ==
   START
== */
document.addEventListener('DOMContentLoaded', () => {
    TEXT.init();
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
});
})();
