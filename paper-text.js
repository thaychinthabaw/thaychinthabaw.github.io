(() => {
'use strict';
/* == GLOBAL STATE == */
let currentLineHeight = 2.0;
let currentLetterSpacing = 0;
// 🔥 ရုတ်တရက် Scroll ဆွဲတာမျိုး မထပ်စေရန် ဗဟို Timer တစ်ခု သတ်မှတ်ခြင်း
let restoreTimer = null;
// 🔥 Layout Engine ၏ ပြောင်းလဲမှု (အမြင့်/အကျယ်) အားလုံးကို ဖမ်းယူမည့် Native Observer
let fontResizeObserver = null;

/* == SEMANTIC SYSTEM == */
function buildSemanticParagraphs() {
    const containers = document.querySelectorAll('.raw-text');
    let globalIndex = 1;
    containers.forEach((container) => {
        // 🔥 IMPORTANT FIX: textContent
        const rawText = container.textContent.trim();
        const paragraphs = rawText
            .split(/\n\s*\n/)
            .filter(p => p.trim() !== '');
        container.innerHTML = '';
        paragraphs.forEach((text) => {
            const cleanText = text.trim();

            // ===== GAP SYSTEM =====
            if (cleanText === '@@gap') {
                const gap = document.createElement('div');
                gap.className = 'big-gap';
                container.appendChild(gap);
                return;
            }

            // ===== PARAGRAPH =====
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

    // စာဖတ်သူ အဓိက မျက်စိကျနေမယ့် Screen ရဲ့ အလယ်ဗဟို မျဉ်းကြောင်းကို ယူပါတယ်
    const viewportCenter = window.innerHeight / 2;

    paragraphs.forEach(p => {
        const rect = p.getBoundingClientRect();
        // စာပိုဒ်က Screen ရဲ့ အလယ်ဗဟိုကို ဖြတ်သန်းနေသလား စစ်ဆေးခြင်း
        if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
            currentParagraph = p.dataset.p;
            // ထိုစာပိုဒ်ရဲ့ ထိပ်ပိုင်းကနေ Screen အလယ်အထိ ရောက်နေတဲ့ အချိုးအစားကို တွက်ချက်ခြင်း
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
    try {
        data = JSON.parse(saved);
    } catch {
        return;
    }

    const target = document.querySelector(`[data-p="${data.paragraph}"]`);
    if (!target) return;

    // ResizeObserver ကြောင့် target.offsetHeight က သေჩာပေါက် Layout အသစ်၏ အမြင့်အစစ်အမှန် ဖြစ်နေပါပြီ
    const paragraphHeight = target.offsetHeight;
    const offsetInsideParagraph = paragraphHeight * (data.offsetRatio || 0);

    // စာပိုဒ်၏ လက်ရှိ absolute top နေရာအစစ်အမှန်
    const absoluteTop = target.getBoundingClientRect().top + window.scrollY;

    // စာဖတ်သူ ဖတ်လက်စနေရာကို Screen ရဲ့ အလယ်ဗဟို (Center) တွင် ကွက်တိ ပြန်ထားပေးခြင်း
    const viewportCenter = window.innerHeight / 2;
    const finalY = absoluteTop + offsetInsideParagraph - viewportCenter;

    window.scrollTo({
        top: finalY,
        behavior: 'auto' // Layout Engine အပြောင်းအလဲတွင် auto သည် ရာနှုန်းပြည့် ငြိမ်သက်မှုပေးနိုင်ပါသည်
    });
}

// 🔥 ขလုတ်နှိပ်လိုက်သည့်အခါ သို့မဟုတ် Page စပွင့်ချိန် Layout အပြောင်းအလဲ ပြီးမြောက်မှုကို စောင့်ကြည့်ပေးမည့် ဗဟိုတံခါးပေါက်လုပ်ဆောင်ချက်
function triggerLayoutObserver() {
    if (fontResizeObserver) {
        fontResizeObserver.disconnect();
    }

    const articleElement = document.querySelector('article');
    if (!articleElement) return;

    fontResizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
            restoreReadingPosition(); // Browser က Layout ကွက်တိချပြီးမှ နေရာပြန်ရွှေ့ပေးခြင်း
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
                <a href="${lastUrl}" style="color: #443300; font-weight: bold; text-decoration: none;">
                    📖 ${lastTitle} သို့ ပြန်သွားရန်
                </a>
            </div>
        `;
    }
}

/* == LINE HEIGHT SYSTEM == */
function applyLineHeight() {
    const content = document.getElementById('reading-content');
    if (content) {
        content.style.lineHeight = currentLineHeight;
    }
    const lhDisplay = document.getElementById('lh-display');
    if (lhDisplay) {
        lhDisplay.innerText = currentLineHeight.toFixed(1);
    }
    const lineButtons = document.querySelectorAll('.line-btn');
    lineButtons.forEach(btn => {
        btn.classList.remove('active-preset');
        if (parseFloat(btn.dataset.value) === currentLineHeight) {
            btn.classList.add('active-preset');
        }
    });
    localStorage.setItem('userLineHeight', currentLineHeight);
}

function adjustLineHeight(amount) {
    saveReadingPosition();
    let next = Math.round((currentLineHeight + amount) * 10) / 10;
    if (next >= 1.0 && next <= 100.0) {
        currentLineHeight = next;
        triggerLayoutObserver(); // ⚡ ResizeObserver ဖြင့် Engine အပြောင်းအလဲကို စောင့်ကြည့်ခြင်း
        applyLineHeight();
    }
}

/* == LETTER SPACING SYSTEM == */
function applyLetterSpacing() {
    const content = document.getElementById('reading-content');
    if (content) {
        content.style.letterSpacing = currentLetterSpacing + 'px';
    }
    const lsDisplay = document.getElementById('ls-display');
    if (lsDisplay) {
        lsDisplay.innerText = currentLetterSpacing;
    }
    const letterButtons = document.querySelectorAll('.letter-btn');
    letterButtons.forEach(btn => {
        btn.classList.remove('active-preset');
        if (parseFloat(btn.dataset.value) === currentLetterSpacing) {
            btn.classList.add('active-preset');
        }
    });
    localStorage.setItem('userLetterSpacing', currentLetterSpacing);
}

function adjustLetterSpacing(amount) {
    saveReadingPosition();
    let next = Math.round((currentLetterSpacing + amount) * 10) / 10;
    if (next >= 0 && next <= 10) {
        currentLetterSpacing = next;
        triggerLayoutObserver(); // ⚡ ResizeObserver ဖြင့် Engine အပြောင်းအလဲကို စောင့်ကြည့်ခြင်း
        applyLetterSpacing();
    }
}

/* == TOC SEARCH == */
function clearTOCSearch() {
    const tocSearch = document.getElementById('toc-search');
    const tocItems = document.querySelectorAll('.toc-list li');
    if (tocSearch) {
        tocSearch.value = '';
    }
    tocItems.forEach(item => {
        item.style.display = 'block';
    });
}

/* == FONT SIZE SYSTEM == */
let fontSize = parseInt(localStorage.getItem('userFontSize')) || 25;

function renderFontSize() {
    const articleElement = document.querySelector('article');
    if (articleElement) {
        articleElement.style.fontSize = fontSize + 'px';
    }
    const fontDisplay = document.getElementById('font-size-display');
    if (fontDisplay) {
        fontDisplay.textContent = fontSize;
    }
    const sizeTens = document.getElementById('size-tens');
    const sizeOnes = document.getElementById('size-ones');
    if (sizeTens) {
        sizeTens.textContent = Math.floor(fontSize / 10);
    }
    if (sizeOnes) {
        sizeOnes.textContent = fontSize % 10;
    }
    localStorage.setItem('userFontSize', fontSize);
}

function changeFontSize(amount) {
    saveReadingPosition();
    const next = fontSize + amount;
    if (next >= 10 && next <= 70) {
        fontSize = next;
        triggerLayoutObserver(); // ⚡ ResizeObserver ဖြင့် Engine အပြောင်းအလဲကို စောင့်ကြည့်ခြင်း
        renderFontSize();
    }
}

/* == FONT WEIGHT SYSTEM == */
let currentWeight = parseInt(localStorage.getItem('userFontWeight')) || 500;

function renderWeight() {
    const articleElement = document.querySelector('article');
    if (articleElement) {
        articleElement.style.fontWeight = currentWeight;
    }
    const hundreds = document.getElementById('digit-hundreds');
    const tens = document.getElementById('digit-tens');
    const ones = document.getElementById('digit-ones');
    if (hundreds) {
        hundreds.textContent = Math.floor(currentWeight / 100);
    }
    if (tens) {
        tens.textContent = Math.floor((currentWeight % 100) / 10);
    }
    if (ones) {
        ones.textContent = currentWeight % 10;
    }

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
        triggerLayoutObserver(); // ⚡ ResizeObserver ဖြင့် Engine အပြောင်းအလဲကို စောင့်ကြည့်ခြင်း
        renderWeight();
    }
}

/* == 📋 PASTE / FILE SYSTEM 📋 == */
function saveCustomBook(title, content) {
    const bookData = {
        title: title,
        content: content,
        updated: Date.now()
    };
    localStorage.setItem('customBook', JSON.stringify(bookData));
    renderRecentBook();
}

function loadCustomBook() {
    const saved = localStorage.getItem('customBook');
    if (!saved) return null;
    try {
        return JSON.parse(saved);
    } catch {
        return null;
    }
}

function renderRecentBook() {
    const box = document.getElementById('recent-file-box');
    if (!box) return;
    const data = loadCustomBook();
    if (!data) {
        box.innerHTML = '';
        return;
    }
    box.innerHTML = `
        <div class="recent-card">
            <div class="recent-card-title">
                📖 နောက်ဆုံးဖတ်ခဲ့သောဖိုင်
            </div>
            <button class="setting-item" onclick="openSavedBook()">
                ${data.title}
            </button>
        </div>
    `;
}

function openSavedBook() {
    const data = loadCustomBook();
    if (!data) return;
    const container = document.querySelector('.raw-text');
    if (!container) return;

    container.textContent = data.content;
    buildSemanticParagraphs();
    triggerLayoutObserver(); // Layout Engine ပြောင်းလဲမှုကို လှမ်းသိစေပြီး နေရာအမှန်ပြန်ချခြင်း
    toggleSetting();
}

/* ===== TEXT PASTE ===== */
function handlePasteRead() {
    const input = document.getElementById('paste-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) {
        alert('စာမရှိသေးပါ');
        return;
    }
    saveCustomBook('Pasted Text', text);
    const container = document.querySelector('.raw-text');
    if (container) {
        container.textContent = text;
        buildSemanticParagraphs();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    toggleSetting();
}

/* ===== TXT / PDF UPLOAD & PARSE ===== */
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const fileName = file.name;

    const container = document.querySelector('.raw-text');
    if (!container) return;

    /* ===== (က) TXT FILE PROCESSING ===== */
    if (file.type === 'text/plain' || fileName.endsWith('.txt')) {
        const text = await file.text();
        saveCustomBook(fileName, text);
        container.textContent = text;
        buildSemanticParagraphs();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toggleSetting();
    }
    /* ===== (ခ) PDF FILE PROCESSING (USING PDF.JS) ===== */
    else if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
        if (typeof pdfjsLib === 'undefined') {
            alert('PDF support အတွက် cdnjs (pdf.js) script ချိတ်ဆက်ရန် လိုအပ်ပါသည်ဗျာ');
            return;
        }

        const reader = new FileReader();
        reader.onload = async function() {
            try {
                const typedarray = new Uint8Array(this.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = '';

                // စာမျက်နှာအားလုံးကို ပတ်ပြီး စာသားထုတ်ယူခြင်း
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n\n';
                }

                if (!fullText.trim()) {
                    alert('PDF ထဲမှ စာသားများကို ဖတ်မရပါ (သို့မဟုတ်) ရုပ်ပုံသီးသန့်ဖြစ်နေနိုင်ပါသည်');
                    return;
                }

                saveCustomBook(fileName, fullText);
                container.textContent = fullText;
                buildSemanticParagraphs();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                toggleSetting();
            } catch (error) {
                console.error(error);
                alert('PDF ဖတ်ရယူရာတွင် အမှားအယွင်းရှိသွားပါသည်');
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert('TXT / PDF ဗားရှင်းဖိုင်များသာ တင်သွင်းနိုင်ပါသည်');
    }
}
/* == PASTE / FILE SYSTEM အဆုံး == */

/* == MAIN INIT == */
function init() {
    const article = document.querySelector('article');
    const tocSearch = document.getElementById('toc-search');
    const tocItems = document.querySelectorAll('.toc-list li');

    /* ===== 🌟 (၁) LOAD & APPLY ALL SAVED SETTINGS FIRST 🌟 ===== */
    // စာမျက်နှာ စပွင့်ချင်း နေရာမချမီ Layout Settings အဟောင်းအားလုံးကို Engine ထဲ ကြိုတင်ထည့်သွင်းခြင်း
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

    const savedFS = localStorage.getItem('userFontSize');
    if (savedFS !== null) {
        fontSize = parseInt(savedFS);
    }
    renderFontSize();

    const savedFW = localStorage.getItem('userFontWeight');
    if (savedFW !== null) {
        currentWeight = parseInt(savedFW);
    }
    renderWeight();

    /* ===== LAST READ ===== */
    saveCurrentPage();
    showLastReadLink();

    /* ===== 🌟 CUSTOM USER BOOK AUTO-RELOAD 🌟 ===== */
    // စာမျက်နှာ Refresh ဖြစ်သွားရင်လည်း တင်ထားဖတ်လက်စစာကို အလိုအလျောက် ပြန်ဆွဲတင်ပေးခြင်း
    const customBook = loadCustomBook();
    const container = document.querySelector('.raw-text');
    if (customBook && container) {
        container.textContent = customBook.content;
    }

    /* ===== SEMANTIC ===== */
    buildSemanticParagraphs();

    /* ===== 🌟 (၂) INITIAL RESTORE WITH OBSERVER 🌟 ===== */
    // စာမျက်နှာစဖွင့်ချိန်တွင် Browser က User ရဲ့ Setting အတိုင်း အမြင့်အစစ်အမှန်ကို တွက်ချက်ပြီးစီးမှ တိကျစွာ Scroll ပြန်ဆွဲပေးရန် ချိတ်ဆက်ခြင်း
    triggerLayoutObserver();

    let readingTimer;
    window.addEventListener('scroll', () => {
        clearTimeout(readingTimer);
        readingTimer = setTimeout(() => {
            saveReadingPosition();
        }, 200);
    });

    /* ===== 🌟 (၃) PASTE / UPLOAD INITIALIZE 🌟 ===== */
    renderRecentBook();
    const pasteBtn = document.getElementById('paste-read-btn');
    if (pasteBtn) {
        pasteBtn.addEventListener('click', handlePasteRead);
    }
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }

    /* ===== TOC ACTIVE ===== */
    const sections = document.querySelectorAll('section');
    const tocLinks = document.querySelectorAll('.toc-list li a');
    const observerOptions = {
        root: null,
        rootMargin: '-10% 0px -70% 0px',
        threshold: 0
    };
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
    sections.forEach(section => {
        observer.observe(section);
    });

    /* ===== LINE HEIGHT BUTTONS ===== */
    const lineButtons = document.querySelectorAll('.line-btn');
    lineButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            saveReadingPosition();
            currentLineHeight = parseFloat(btn.dataset.value);
            triggerLayoutObserver();
            applyLineHeight();
        });
    });

    /* ===== LETTER SPACING BUTTONS ===== */
    const letterButtons = document.querySelectorAll('.letter-btn');
    letterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            saveReadingPosition();
            currentLetterSpacing = parseFloat(btn.dataset.value);
            triggerLayoutObserver();
            applyLetterSpacing();
        });
    });

    /* ===== FONT SIZE BUTTON EVENTS ===== */
    const fontIncrease = document.getElementById('font-increase');
    if (fontIncrease) fontIncrease.onclick = () => { changeFontSize(1); };

    const fontDecrease = document.getElementById('font-decrease');
    if (fontDecrease) fontDecrease.onclick = () => { changeFontSize(-1); };

    const sizePlus10 = document.getElementById('size-plus-10');
    if (sizePlus10) sizePlus10.onclick = () => { changeFontSize(10); };

    const sizeMinus10 = document.getElementById('size-minus-10');
    if (sizeMinus10) sizeMinus10.onclick = () => { changeFontSize(-10); };

    const sizePlus1 = document.getElementById('size-plus-1');
    if (sizePlus1) sizePlus1.onclick = () => { changeFontSize(1); };

    const sizeMinus1 = document.getElementById('size-minus-1');
    if (sizeMinus1) sizeMinus1.onclick = () => { changeFontSize(-1); };

    /* ===== FONT WEIGHT BUTTON EVENTS ===== */
    const weightButtons = document.querySelectorAll('#weight-buttons .preset-btn');
    weightButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            saveReadingPosition();
            currentWeight = parseInt(btn.dataset.weight);
            triggerLayoutObserver();
            renderWeight();
        });
    });

    const weightPlus100 = document.getElementById('weight-plus-100');
    if (weightPlus100) weightPlus100.onclick = () => { changeWeight(100); };

    const weightMinus100 = document.getElementById('weight-minus-100');
    if (weightMinus100) weightMinus100.onclick = () => { changeWeight(-100); };

    const weightPlus10 = document.getElementById('weight-plus-10');
    if (weightPlus10) weightPlus10.onclick = () => { changeWeight(10); };

    const weightMinus10 = document.getElementById('weight-minus-10');
    if (weightMinus10) weightMinus10.onclick = () => { changeWeight(-10); };

    const weightPlus1 = document.getElementById('weight-plus-1');
    if (weightPlus1) weightPlus1.onclick = () => { changeWeight(1); };

    const weightMinus1 = document.getElementById('weight-minus-1');
    if (weightMinus1) weightMinus1.onclick = () => { changeWeight(-1); };

    /* ===== TOC TOP/BOTTOM ===== */
    const tocTopBtn = document.getElementById('toc-top-btn');
    const tocBottomBtn = document.getElementById('toc-bottom-btn');
    const tocContent = document.querySelector('.toc-list');
    if (tocTopBtn && tocContent) {
        tocTopBtn.addEventListener('click', () => {
            tocContent.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    if (tocBottomBtn && tocContent) {
        tocBottomBtn.addEventListener('click', () => {
            tocContent.scrollTo({ top: tocContent.scrollHeight, behavior: 'smooth' });
        });
    }

    /* ===== TOC SEARCH ===== */
    if (tocSearch) {
        tocSearch.addEventListener('input', () => {
            const searchText = tocSearch.value.toLowerCase();
            tocItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(searchText) ? 'block' : 'none';
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
    window.openSavedBook = openSavedBook; // HTML inline 'onclick' အတွက် Global Scope သို့ ချိတ်ပေးခြင်း
}

/* == SINGLE DOMCONTENTLOADED == */
document.addEventListener('DOMContentLoaded', init);
})();
