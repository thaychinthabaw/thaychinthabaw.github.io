(() => {
'use strict';

let currentLineHeight = 2.0;
let currentLetterSpacing = 0;
let fontResizeObserver = null; 
let fontSize = parseInt(localStorage.getItem('userFontSize')) || 25;
let currentWeight = parseInt(localStorage.getItem('userFontWeight')) || 500;
let bookData = null;

// ===== 🌟 FETCH JSON DATA & RENDER 🌟 =====
async function loadBookData() {
    try {
        const response = await fetch('pati.json');
        bookData = await response.json();
        
        if(bookData && bookData.bookTitle) {
            document.title = bookData.bookTitle;
        }
        
        renderTOC(bookData.chapters);
        renderContent(bookData.chapters);
        
        // ဒေတာဆွဲယူပြီးမှ Layout Engine များကို စတင်ပတ်မောင်းမည်
        initLayoutEngine();
    } catch (error) {
        console.error("စာမူဒေတာဆွဲယူ၍မရပါ- ", error);
    }
}

function renderTOC(chapters) {
    const tocList = document.getElementById('toc-list');
    if (!tocList) return;
    tocList.innerHTML = '';
    
    chapters.forEach(ch => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${ch.id}`;
        a.className = ch.type === 'main-title' ? 'main-title' : 'sub-title';
        a.onclick = (e) => { e.preventDefault(); scrollToSection(ch.id); };
        a.textContent = ch.title;
        li.appendChild(a);
        tocList.appendChild(li);
    });
}

function renderContent(chapters) {
    const contentArea = document.getElementById('reading-content');
    if (!contentArea) return;
    
    // Header Wrapper များထားရှိရန် နေရာလွတ် ချန်လှပ်သည်
    const lastReadBox = document.getElementById('last-read-container');
    contentArea.innerHTML = '';
    if(lastReadBox) contentArea.appendChild(lastReadBox);

    let globalPIndex = 1;

    chapters.forEach(ch => {
        const section = document.createElement('section');
        section.id = ch.id;
        
        // ခေါင်းစဉ်တပ်ဆင်ခြင်း
        const h1 = document.createElement('h1');
        h1.textContent = ch.title;
        
        // Audio ဖွင့်ရန် Speaker ခလုတ်ကို ချိတ်ဆက်ခြင်း
        const speakerBtn = document.createElement('button');
        speakerBtn.className = 'speaker-btn';
        speakerBtn.innerHTML = '🔊';
        speakerBtn.onclick = () => {
            if(window.togglePaperAudio) {
                window.togglePaperAudio(speakerBtn, ch.audioSrc, ch.title);
            }
        };
        h1.insertBefore(speakerBtn, h1.firstChild);
        section.appendChild(h1);

        // စာကိုယ်များကို စာပိုဒ်ခွဲထုတ်ခြင်း
        const rawTextBox = document.createElement('div');
        rawTextBox.className = 'raw-text';
        
        const paragraphs = ch.content.split(/\n\s*\n/).filter(p => p.trim() !== '');
        paragraphs.forEach(text => {
            const cleanText = text.trim();
            if (cleanText === '@@gap') {
                const gap = document.createElement('div');
                gap.className = 'big-gap';
                rawTextBox.appendChild(gap);
                return;
            }
            const p = document.createElement('p');
            p.setAttribute('data-p', globalPIndex);
            p.textContent = cleanText;
            rawTextBox.appendChild(p);
            globalPIndex++;
        });

        section.appendChild(rawTextBox);
        contentArea.appendChild(section);
    });
}

function scrollToSection(id) {
    const target = document.getElementById(id);
    if(target) {
        toggleTOC();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ===== SEMANTIC & SCROLL POSITION MEMORY =====
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
        localStorage.setItem('readingPosition', JSON.stringify({
            paragraph: currentParagraph,
            offsetRatio: offsetRatio
        }));
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
    
    window.scrollTo({ top: finalY, behavior: 'auto' });
}

function triggerLayoutObserver() {
    if (fontResizeObserver) fontResizeObserver.disconnect();
    const articleElement = document.querySelector('article');
    if (!articleElement) return;

    fontResizeObserver = new ResizeObserver(() => {
        restoreReadingPosition();
        fontResizeObserver.disconnect();
        fontResizeObserver = null;
    });
    fontResizeObserver.observe(articleElement);
}

// ===== LAYOUT SYSTEMS =====
function applyLineHeight() {
    const content = document.getElementById('reading-content');
    if (content) content.style.lineHeight = currentLineHeight;
    const lhDisplay = document.getElementById('lh-display');
    if (lhDisplay) lhDisplay.innerText = currentLineHeight.toFixed(1);
    
    document.querySelectorAll('.line-btn').forEach(btn => {
        btn.classList.remove('active-preset');
        if (parseFloat(btn.dataset.value) === currentLineHeight) btn.classList.add('active-preset');
    });
    localStorage.setItem('userLineHeight', currentLineHeight);
}

function adjustLineHeight(amount) {
    saveReadingPosition();
    let next = Math.round((currentLineHeight + amount) * 10) / 10;
    if (next >= 1.0 && next <= 5.0) {
        currentLineHeight = next;
        triggerLayoutObserver();
        applyLineHeight();
    }
}

function applyLetterSpacing() {
    const content = document.getElementById('reading-content');
    if (content) content.style.letterSpacing = currentLetterSpacing + 'px';
    const lsDisplay = document.getElementById('ls-display');
    if (lsDisplay) lsDisplay.innerText = currentLetterSpacing;
    
    document.querySelectorAll('.letter-btn').forEach(btn => {
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

function renderWeight() {
    const articleElement = document.querySelector('article');
    if (articleElement) articleElement.style.fontWeight = currentWeight;
    
    const hundreds = document.getElementById('digit-hundreds');
    const tens = document.getElementById('digit-tens');
    const ones = document.getElementById('digit-ones');
    if (hundreds) hundreds.textContent = Math.floor(currentWeight / 100);
    if (tens) tens.textContent = Math.floor((currentWeight % 100) / 10);
    if (ones) ones.textContent = currentWeight % 10;
    
    document.querySelectorAll('#weight-buttons .preset-btn').forEach(btn => {
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

// ===== TOGGLE MECHANICS =====
function toggleTOC() {
    const tocOverlay = document.getElementById('toc-overlay');
    if (!tocOverlay) return;
    tocOverlay.style.display = tocOverlay.style.display === 'block' ? 'none' : 'block';
}

function toggleSetting() {
    const settingOverlay = document.getElementById('setting-overlay');
    if (!settingOverlay) return;
    settingOverlay.style.display = settingOverlay.style.display === 'block' ? 'none' : 'block';
}

function downloadPDF() {
    toggleSetting();
    setTimeout(() => { window.print(); }, 500);
}

function toggleReadingMode() {
    document.body.classList.toggle('focus-mode');
    const fsBtn = document.getElementById('fs-btn');
    if (fsBtn) {
        fsBtn.innerHTML = document.body.classList.contains('focus-mode') ? '✖' : '⛶';
    }
}

// ===== LAYOUT ENGINE ENGINE INIT =====
function initLayoutEngine() {
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
    
    triggerLayoutObserver(); 
    
    let readingTimer;
    window.addEventListener('scroll', () => {
        clearTimeout(readingTimer);
        readingTimer = setTimeout(() => { saveReadingPosition(); }, 200);
    });
    
    // IntersectionObserver Active Chapter Tracking
    const sections = document.querySelectorAll('section');
    const observerOptions = { root: null, rootMargin: '-10% 0px -70% 0px', threshold: 0 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                document.querySelectorAll('.toc-list li a').forEach(link => {
                    link.classList.remove('active-chapter');
                    if (link.getAttribute('href') === `#${id}`) link.classList.add('active-chapter');
                });
            }
        });
    }, observerOptions);
    sections.forEach(sec => observer.observe(sec));
}

// ===== EVENT BINDINGS =====
document.addEventListener('DOMContentLoaded', () => {
    loadBookData(); // JSON စတင်ဆွဲယူခြင်း

    document.getElementById('font-increase').onclick = () => changeFontSize(1);
    document.getElementById('font-decrease').onclick = () => changeFontSize(-1);
    document.getElementById('size-plus-10').onclick = () => changeFontSize(10);
    document.getElementById('size-minus-10').onclick = () => changeFontSize(-10);
    document.getElementById('size-plus-1').onclick = () => changeFontSize(1);
    document.getElementById('size-minus-1').onclick = () => changeFontSize(-1);

    document.querySelectorAll('.line-btn').forEach(btn => {
        btn.onclick = () => { saveReadingPosition(); currentLineHeight = parseFloat(btn.dataset.value); triggerLayoutObserver(); applyLineHeight(); };
    });

    document.querySelectorAll('.letter-btn').forEach(btn => {
        btn.onclick = () => { saveReadingPosition(); currentLetterSpacing = parseFloat(btn.dataset.value); triggerLayoutObserver(); applyLetterSpacing(); };
    });

    document.querySelectorAll('#weight-buttons .preset-btn').forEach(btn => {
        btn.onclick = () => { saveReadingPosition(); currentWeight = parseInt(btn.dataset.weight); triggerLayoutObserver(); renderWeight(); };
    });

    document.getElementById('weight-plus-100').onclick = () => changeWeight(100);
    document.getElementById('weight-minus-100').onclick = () => changeWeight(-100);
    document.getElementById('weight-plus-10').onclick = () => changeWeight(10);
    document.getElementById('weight-minus-10').onclick = () => changeWeight(-10);
    document.getElementById('weight-plus-1').onclick = () => changeWeight(1);
    document.getElementById('weight-minus-1').onclick = () => changeWeight(-1);

    const tocSearch = document.getElementById('toc-search');
    if (tocSearch) {
        tocSearch.addEventListener('input', () => {
            const query = tocSearch.value.toLowerCase();
            document.querySelectorAll('.toc-list li').forEach(item => {
                item.style.display = item.textContent.toLowerCase().includes(query) ? 'block' : 'none';
            });
        });
    }

    document.getElementById('toc-top-btn').onclick = () => document.querySelector('.toc-list').scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('toc-bottom-btn').onclick = () => { const tl = document.querySelector('.toc-list'); tl.scrollTo({ top: tl.scrollHeight, behavior: 'smooth' }); };

    window.toggleTOC = toggleTOC;
    window.toggleSetting = toggleSetting;
    window.downloadPDF = downloadPDF;
    window.toggleReadingMode = toggleReadingMode;
    window.adjustLineHeight = adjustLineHeight;
    window.adjustLetterSpacing = adjustLetterSpacing;
});
})();
