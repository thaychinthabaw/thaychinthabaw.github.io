(() => {
'use strict';
/* == GLOBAL STATE == */
let currentLineHeight = 2.0;
let currentLetterSpacing = 0;
let restoreTimer = null;
let fontResizeObserver = null; 

/* == SEMANTIC SYSTEM (UPDATED FOR JSON) == */
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

/* == JSON LOADER ENGINE == */
async function loadJsonContent() {
    try {
        const response = await fetch('pati.json');
        const data = await response.json();
        
        // စာမျက်နှာ ခေါင်းစဉ်များ ချိတ်ဆက်ခြင်း
        document.title = data.bookTitle || document.title;
        const mainHeading = document.getElementById('js-main-heading');
        const subHeading = document.getElementById('js-sub-heading');
        if (mainHeading && data.mainHeading) mainHeading.textContent = data.mainHeading;
        if (subHeading && data.subHeading) subHeading.textContent = data.subHeading;

        // အခန်းများထုတ်ယူခြင်း
        const chaptersContainer = document.getElementById('dynamic-chapters');
        if (chaptersContainer && data.chapters) {
            chaptersContainer.innerHTML = '';
            data.chapters.forEach(ch => {
                const section = document.createElement('section');
                section.id = ch.id;
                
                const h1 = document.createElement('h1');
                h1.innerHTML = `${ch.title} <button class="speaker-btn" onclick="togglePaperAudio(this, '${ch.audioSrc}', '${ch.audioTitle}')">🔊</button>`;
                
                const rawDiv = document.createElement('div');
                rawDiv.className = 'raw-text';
                rawDiv.textContent = ch.content;
                
                section.appendChild(h1);
                section.appendChild(rawDiv);
                chaptersContainer.appendChild(section);
            });
        }

        // မာတိကာ ထုတ်ယူခြင်း
        const tocContainer = document.getElementById('toc-list');
        if (tocContainer && data.toc) {
            tocContainer.innerHTML = '';
            data.toc.forEach(item => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = item.href;
                a.className = item.class;
                a.setAttribute('onclick', 'toggleTOC()');
                a.textContent = item.text;
                li.appendChild(a);
                tocContainer.appendChild(li);
            });
        }

        // စာပိုဒ်များခွဲထုတ်ခြင်းနှင့် Layout ပုံဖော်ခြင်းကို JSON အောင်မြင်ပြီးမှ လုပ်ဆောင်မည်
        buildSemanticParagraphs();
        triggerLayoutObserver();
        initScrollAndIntersection();

    } catch (error) {
        console.error("JSON စာမူဖတ်ရှုခြင်း မအောင်မြင်ပါ - ", error);
    }
}

function saveReadingPosition() {
    const paragraphs = document.querySelectorAll('.raw-text p');
    let currentParagraph = null;
    let offsetRatio = 0;
    const viewportCenter = window.innerHeight / 2;

    paragraphs.forEach(p => {
        const rect = p.getBoundingClientRect();
        if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
            currentParagraph = p.dataset.p;
            offsetRatio = (viewportCenter - rect.top) / rect.height;
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
    try { data = JSON.parse(saved); } catch { return; }

    const target = document.querySelector(`[data-p="${data.paragraph}"]`);
    if (!target) return;
    
    const paragraphHeight = target.offsetHeight;
    const offsetInsideParagraph = paragraphHeight * (data.offsetRatio || 0);
    const absoluteTop = target.getBoundingClientRect().top + window.scrollY;
    const viewportCenter = window.innerHeight / 2;
    const finalY = absoluteTop + offsetInsideParagraph - viewportCenter;
    
    window.scrollTo({
        top: finalY,
        behavior: 'auto'
    });
}

function triggerLayoutObserver() {
    if (fontResizeObserver) {
        fontResizeObserver.disconnect();
    }

    const articleElement = document.querySelector('article');
    if (!articleElement) return;

    fontResizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
            restoreReadingPosition();
            fontResizeObserver.disconnect();
            fontResizeObserver = null;
        }
    });

    fontResizeObserver.observe(articleElement);
}

/* == TOGGLE SYSTEM == */
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

/* == LAST READ SYSTEM == */
function saveCurrentPage() {
    localStorage.setItem('lastReadTitle', document.title);
    localStorage.setItem('lastReadUrl', window.location.href);
}

function showLastReadLink() {
    const lastTitle = localStorage.getItem('lastReadTitle');
    const lastUrl = localStorage.getItem('lastReadUrl');
    const lastReadContainer = document.getElementById('last-read-container');
    if (lastTitle && lastUrl && window.location.href !== lastUrl && lastReadContainer) {
        lastReadContainer.innerHTML = `
            <div style="background: #eadebc; border: 1px solid #443300; padding: 15px; margin: 10px; border-radius: 8px; text-align:center;">
                <p style="color: #443300; font-size: 14px; margin-bottom: 5px;">သင်နောက်ဆုံး ဖတ်လက်စအပိုင်း -</p>
                <a href="${lastUrl}" style="color: #443300; font-weight: bold; text-decoration: none;">📖 ${lastTitle} သို့ ပြန်သွားရန်</a>
            </div>
        `;
    }
}

/* == LINE HEIGHT SYSTEM == */
function applyLineHeight() {
    const content = document.getElementById('reading-content');
    if (content) content.style.lineHeight = currentLineHeight;
    const lhDisplay = document.getElementById('lh-display');
    if (lhDisplay) lhDisplay.innerText = currentLineHeight.toFixed(1);
    const lineButtons = document.querySelectorAll('.line-btn');
    lineButtons.forEach(btn => {
        btn.classList.remove('active-preset');
        if (parseFloat(btn.dataset.value) === currentLineHeight) btn.classList.add('active-preset');
    });
    localStorage.setItem('userLineHeight', currentLineHeight);
}

function adjustLineHeight(amount) {
    saveReadingPosition();
    let next = Math.round((currentLineHeight + amount) * 10) / 10;
    if (next >= 1.0 && next <= 100.0) {
        currentLineHeight = next;
        triggerLayoutObserver();
        applyLineHeight();
    }
}

/* == LETTER SPACING SYSTEM == */
function applyLetterSpacing() {
    const content = document.getElementById('reading-content');
    if (content) content.style.letterSpacing = currentLetterSpacing + 'px';
    const lsDisplay = document.getElementById('ls-display');
    if (lsDisplay) lsDisplay.innerText = currentLetterSpacing;
    const letterButtons = document.querySelectorAll('.letter-btn');
    letterButtons.forEach(btn => {
        btn.classList.remove('active-preset');
        if (parseFloat(btn.dataset.value) === currentLetterSpacing) btn.classList.add('active-preset');
    });
    localStorage.setItem('userLetterSpacing', currentLetterSpacing);
}

function adjustLetterSpacing(amount) {
    saveReadingPosition();
    let next = Math.round((currentLetterSpacing + amount) * 10) / 10;
    if (next >= 0 && next <= 10) {
        currentLetterSpacing = next;
        triggerLayoutObserver();
        applyLetterSpacing();
    }
}

/* == TOC SEARCH == */
function clearTOCSearch() {
    const tocSearch = document.getElementById('toc-search');
    const tocItems = document.querySelectorAll('.toc-list li');
    if (tocSearch) tocSearch.value = '';
    tocItems.forEach(item => { item.style.display = 'block'; });
}

/* == FONT SIZE SYSTEM == */
let fontSize = parseInt(localStorage.getItem('userFontSize')) || 25;
function renderFontSize() {
    const articleElement = document.querySelector('article');
    if (articleElement) articleElement.style.fontSize = fontSize + 'px';
    const fontDisplay = document.getElementById('font-size-display');
    if (fontDisplay) fontDisplay.textContent = fontSize;
    const sizeTens = document.getElementById('size-tens');
    const sizeOnes = document.getElementById('size-ones');
    if (sizeTens) sizeTens.textContent = Math.floor(fontSize / 10);
    if (sizeOnes) sizeOnes.textContent = fontSize % 10;
    localStorage.setItem('userFontSize', fontSize);
}

function changeFontSize(amount) {
    saveReadingPosition();
    const next = fontSize + amount;
    if (next >= 10 && next <= 70) {
        fontSize = next;
        triggerLayoutObserver();
        renderFontSize();
    }
}

/* == FONT WEIGHT SYSTEM == */
let currentWeight = parseInt(localStorage.getItem('userFontWeight')) || 500;
function renderWeight() {
    const articleElement = document.querySelector('article');
    if (articleElement) articleElement.style.fontWeight = currentWeight;
    const hundreds = document.getElementById('digit-hundreds');
    const tens = document.getElementById('digit-tens');
    const ones = document.getElementById('digit-ones');
    if (hundreds) hundreds.textContent = Math.floor(currentWeight / 100);
    if (tens) tens.textContent = Math.floor((currentWeight % 100) / 10);
    if (ones) ones.textContent = currentWeight % 10;
    
    const weightButtons = document.querySelectorAll('#weight-buttons .preset-btn');
    weightButtons.forEach(btn => {
        btn.classList.toggle('active-preset', parseInt(btn.dataset.weight) === currentWeight);
    });
    localStorage.setItem('userFontWeight', currentWeight);
}

function changeWeight(amount) {
    saveReadingPosition();
    const next = currentWeight + amount;
    if (next >= 100 && next <= 900) {
        currentWeight = next;
        triggerLayoutObserver();
        renderWeight();
    }
}

/* == INTERSECTION & SCROLL (ISOLATED AFTER JSON LOAD) == */
function initScrollAndIntersection() {
    const sections = document.querySelectorAll('section');
    const tocLinks = document.querySelectorAll('.toc-list li a');
    const observerOptions = { root: null, rootMargin: '-10% 0px -70% 0px', threshold: 0 };
    
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
    }, observerOptions);
    sections.forEach(section => { observer.observe(section); });

    const tocSearch = document.getElementById('toc-search');
    if (tocSearch) {
        tocSearch.addEventListener('input', () => {
            const searchText = tocSearch.value.toLowerCase();
            const tocItems = document.querySelectorAll('.toc-list li');
            tocItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(searchText) ? 'block' : 'none';
            });
        });
    }
}

/* == MAIN INIT == */
function init() {
    const article = document.querySelector('article');
    
    const savedLH = localStorage.getItem('userLineHeight');
    if (savedLH !== null) currentLineHeight = parseFloat(savedLH);
    applyLineHeight();
    
    const savedLS = localStorage.getItem('userLetterSpacing');
    if (savedLS !== null) currentLetterSpacing = parseFloat(savedLS);
    applyLetterSpacing();

    const savedFS = localStorage.getItem('userFontSize');
    if (savedFS !== null) fontSize = parseInt(savedFS);
    renderFontSize();

    const savedFW = localStorage.getItem('userFontWeight');
    if (savedFW !== null) currentWeight = parseInt(savedFW);
    renderWeight();
    
    saveCurrentPage();
    showLastReadLink();
    
    // JSON တိုက်ရိုက်ခေါ်ယူအသုံးပြုခြင်း
    loadJsonContent();
    
    let readingTimer;
    window.addEventListener('scroll', () => {
        clearTimeout(readingTimer);
        readingTimer = setTimeout(() => { saveReadingPosition(); }, 200);
    });
    
    /* ===== BUTTON EVENTS ===== */
    const lineButtons = document.querySelectorAll('.line-btn');
    lineButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            saveReadingPosition();
            currentLineHeight = parseFloat(btn.dataset.value);
            triggerLayoutObserver();
            applyLineHeight();
        });
    });
    
    const letterButtons = document.querySelectorAll('.letter-btn');
    letterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            saveReadingPosition();
            currentLetterSpacing = parseFloat(btn.dataset.value);
            triggerLayoutObserver();
            applyLetterSpacing();
        });
    });
    
    document.getElementById('font-increase').onclick = () => { changeFontSize(1); };
    document.getElementById('font-decrease').onclick = () => { changeFontSize(-1); };
    document.getElementById('size-plus-10').onclick = () => { changeFontSize(10); };
    document.getElementById('size-minus-10').onclick = () => { changeFontSize(-10); };
    document.getElementById('size-plus-1').onclick = () => { changeFontSize(1); };
    document.getElementById('size-minus-1').onclick = () => { changeFontSize(-1); };
    
    const weightButtons = document.querySelectorAll('#weight-buttons .preset-btn');
    weightButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            saveReadingPosition();
            currentWeight = parseInt(btn.dataset.weight);
            triggerLayoutObserver();
            renderWeight();
        });
    });
    
    document.getElementById('weight-plus-100').onclick = () => { changeWeight(100); };
    document.getElementById('weight-minus-100').onclick = () => { changeWeight(-100); };
    document.getElementById('weight-plus-10').onclick = () => { changeWeight(10); };
    document.getElementById('weight-minus-10').onclick = () => { changeWeight(-10); };
    document.getElementById('weight-plus-1').onclick = () => { changeWeight(1); };
    document.getElementById('weight-minus-1').onclick = () => { changeWeight(-1); };
    
    const tocTopBtn = document.getElementById('toc-top-btn');
    const tocBottomBtn = document.getElementById('toc-bottom-btn');
    const tocContent = document.querySelector('.toc-list');
    if (tocTopBtn && tocContent) {
        tocTopBtn.addEventListener('click', () => { tocContent.scrollTo({ top: 0, behavior: 'smooth' }); });
    }
    if (tocBottomBtn && tocContent) {
        tocBottomBtn.addEventListener('click', () => { tocContent.scrollTo({ top: tocContent.scrollHeight, behavior: 'smooth' }); });
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
            if (Math.abs(moveX - startX) > 10 || Math.abs(moveY - startY) > 10) { clearTimeout(timer); }
        });
        article.addEventListener('touchend', () => {
            clearTimeout(timer);
            if (!isLongPressed) {
                if (window.getSelection().toString() === '') {
                    article.style.webkitUserSelect = 'none';
                    article.style.userSelect = 'none';
                }
            }
        });
    }
    
    /* ===== EXPORT FUNCTIONS ===== */
    window.toggleTOC = toggleTOC;
    window.toggleSetting = toggleSetting;
    window.downloadPDF = downloadPDF;
    window.toggleReadingMode = toggleReadingMode;
    window.adjustLineHeight = adjustLineHeight;
    window.adjustLetterSpacing = adjustLetterSpacing;
    window.changeFontSize = changeFontSize;
    window.changeWeight = changeWeight;
}

document.addEventListener('DOMContentLoaded', init);
})();
