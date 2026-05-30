(() => {
'use strict';

/* == GLOBAL STATE == */
let currentLineHeight = 2.0;
let currentLetterSpacing = 0;
let fontResizeObserver = null; 
let currentBookId = null; 

/* == STORAGE LIMIT (FIFO SYSTEM) == */
const MAX_BOOKS = 5; 

/* == MYANMAR UNICODE EXTRACTION NORMALIZER == */
function normalizeMyanmarText(text) {
    if (!text) return "";
    
    // ၁။ pdf.js မှ ပါလာနိုင်သော မလိုအပ်သည့် စာလုံးကြား space များကို ရှင်းထုတ်ခြင်း
    let clean = text.replace(/([က-အ])\s+([ါ-ှေံ်ြ-ှ])/g, '$1$2');
    clean = clean.replace(/([ါ-ှေံ်ြ-ှ])\s+([်ျ-ှ])/g, '$1$2');
    
    // ၂။ Google Docs PDF များတွင် အဖြစ်များသော ဇောက်ထိုးဖြစ်နေသည့် သရ/အသတ် အစဉ်လိုက်များကို ပြုပြင်ခြင်း (ဥပမာ - င် နှင့် င်း)
    clean = clean.replace(/်([ေုူံဝာါဥဉ်ညတနမလသဟဠက-အ])/g, '$1်');
    clean = clean.replace(/့([း်])/g, '$1့');
    
    // ၃။ ကွဲအက်နေသော ဗျည်းဆင့်များကြားခံ Zero Width Joiner စနစ်အား စနစ်တကျ ပြန်လည်ထိန်းညှိခြင်း
    clean = clean.replace(/\u200B/g, ''); 
    
    // ၄။ နှစ်ထပ်ဆင့် Space များကို ပုံမှန် Space တစ်ချက်အဖြစ် ပြောင်းလဲခြင်း
    clean = clean.replace(/[ ]+/g, ' ');

    return clean;
}

/* == SEMANTIC SYSTEM == */
function buildSemanticParagraphs() {
    const containers = document.querySelectorAll('.raw-text');
    let globalIndex = 1;
    containers.forEach((container) => {
        const rawText = container.textContent.trim();
        const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim() !== '');
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
    if (!currentBookId) return;
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
            `readingPos_${currentBookId}`,
            JSON.stringify({ paragraph: currentParagraph, offsetRatio: offsetRatio })
        );
    }
}

function restoreReadingPosition() {
    if (!currentBookId) return;
    const saved = localStorage.getItem(`readingPos_${currentBookId}`);
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
    if (fontResizeObserver) { fontResizeObserver.disconnect(); }
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

/* == PASTE & PDF PROCESSING SYSTEM == */
window.switchTab = function(type) {
    document.getElementById('tab-pdf').classList.toggle('active', type === 'pdf');
    document.getElementById('tab-paste').classList.toggle('active', type === 'paste');
    document.getElementById('pane-pdf').classList.toggle('active', type === 'pdf');
    document.getElementById('pane-paste').classList.toggle('active', type === 'paste');
};

window.processPastedText = function() {
    const textInput = document.getElementById('paste-text-input').value.trim();
    if (!textInput) { alert('ကျေးဇူးပြု၍ စာသားတစ်ခုခု ထည့်သွင်းပါဘုရား။'); return; }
    
    const title = textInput.substring(0, 20) + (textInput.length > 20 ? "..." : "");
    const bookId = 'paste_' + Date.now();
    
    const bookData = {
        id: bookId,
        title: title,
        type: 'paste',
        content: textInput,
        pinned: false,
        timestamp: Date.now()
    };
    
    saveBookToStorage(bookData);
    openBook(bookData);
};

function handlePDFUpload(file) {
    if (!file || file.type !== "application/pdf") { alert("PDF ဖိုင်များသာ တင်သွင်းနိုင်ပါသည်ဘုရား။"); return; }
    
    const reader = new FileReader();
    const progressContainer = document.getElementById('progress-container');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const progressPercent = document.getElementById('progress-percent');
    const progressStatus = document.getElementById('progress-status');
    
    progressContainer.style.display = 'block';
    progressBarFill.style.width = '0%';
    progressPercent.textContent = '0%';
    progressStatus.textContent = 'ဖိုင်အား စတင်ဖတ်ရှုနေပါသည်...';

    reader.onload = function(e) {
        const typedarray = new Uint8Array(e.target.result);
        
        pdfjsLib.getDocument(typedarray).promise.then(async function(pdf) {
            let fullText = "";
            const totalPages = pdf.numPages;
            
            for (let i = 1; i <= totalPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                
                // စာကြောင်းလိုက် နေရာမှန်အောင် Layout Alignment အရင်စီခြင်း
                let lastY = null;
                let pageText = "";
                
                for (let item of textContent.items) {
                    if (lastY !== null && item.transform[5] !== lastY) {
                        pageText += "\n"; // စာကြောင်းအသစ်ဆင်းခြင်း
                    }
                    pageText += item.str;
                    lastY = item.transform[5];
                }
                
                // ယူနီကုဒ် စာလုံးဆင့်များအား ပုံမှန်ဖြစ်အောင် ရှင်းထုတ်ခြင်း
                let normalizedPageText = normalizeMyanmarText(pageText);
                
                fullText += `\n\n[=== PAGE_${i} ===]\n\n` + normalizedPageText;
                
                let percent = Math.round((i / totalPages) * 100);
                progressBarFill.style.width = percent + '%';
                progressPercent.textContent = percent + '%';
                progressStatus.textContent = `စာမျက်နှာ (${i}/${totalPages}) အား ဖတ်နေပါသည်...`;
            }
            
            progressContainer.style.display = 'none';
            
            const bookId = 'pdf_' + Date.now();
            const bookData = {
                id: bookId,
                title: file.name.replace(".pdf", ""),
                type: 'pdf',
                content: fullText,
                totalPages: totalPages,
                pinned: false,
                timestamp: Date.now()
            };
            
            saveBookToStorage(bookData);
            openBook(bookData);
            
        }).catch(err => {
            console.error(err);
            alert("PDF ဖတ်ရှုခြင်း လွဲချော်သွားပါသည်ဘုရား။");
            progressContainer.style.display = 'none';
        });
    };
    reader.readAsArrayBuffer(file);
}

/* == BOOKSHELF ENGINE == */
function saveBookToStorage(newBook) {
    let currentBooks = JSON.parse(localStorage.getItem('room_bookshelf') || '[]');
    currentBooks = currentBooks.filter(b => b.id !== newBook.id);
    
    const unpinnedBooks = currentBooks.filter(b => !b.pinned);
    if (currentBooks.length >= MAX_BOOKS && unpinnedBooks.length > 0) {
        const oldestUnpinned = unpinnedBooks[0];
        currentBooks = currentBooks.filter(b => b.id !== oldestUnpinned.id);
        localStorage.removeItem(`readingPos_${oldestUnpinned.id}`);
    }
    
    currentBooks.push(newBook);
    try {
        localStorage.setItem('room_bookshelf', JSON.stringify(currentBooks));
    } catch (e) {
        alert("သိုလှောင်မှု ပြည့်သွားပါသဖြင့် အချို့စာအုပ်များကို ဖျက်ပေးတော်မူပါဦးဘုရား။");
    }
    renderBookshelf();
}

function togglePinBook(id, event) {
    if (event) event.stopPropagation();
    let currentBooks = JSON.parse(localStorage.getItem('room_bookshelf') || '[]');
    currentBooks = currentBooks.map(b => {
        if (b.id === id) { b.pinned = !b.pinned; }
        return b;
    });
    localStorage.setItem('room_bookshelf', JSON.stringify(currentBooks));
    renderBookshelf();
}

function renderBookshelf() {
    const shelfList = document.getElementById('bookshelf-list');
    const storageIndicator = document.getElementById('storage-indicator');
    const currentBooks = JSON.parse(localStorage.getItem('room_bookshelf') || '[]');
    
    let usedSpace = JSON.stringify(localStorage).length;
    let spacePercent = Math.min(Math.round((usedSpace / (5 * 1024 * 1024)) * 100), 100);
    storageIndicator.textContent = `သိုလှောင်မှု: ${spacePercent}%`;

    if (currentBooks.length === 0) {
        shelfList.innerHTML = '<p class="empty-shelf-text">စာအုပ်စင်ပေါ်တွင် စာအုပ်မရှိသေးပါ။</p>';
        return;
    }

    shelfList.innerHTML = '';
    currentBooks.slice().reverse().forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        
        const info = document.createElement('div');
        info.className = 'book-card-info';
        info.onclick = () => openBook(book);
        
        const title = document.createElement('p');
        title.className = 'book-card-title';
        title.textContent = (book.type === 'pdf' ? '📄 ' : '✍️ ') + book.title;
        
        const meta = document.createElement('p');
        meta.className = 'book-card-meta';
        const date = new Date(book.timestamp).toLocaleDateString();
        meta.textContent = `တင်သွင်းရက် - ${date} ${book.totalPages ? `(| စာမျက်နှာ - ${book.totalPages} မျက်နှာ)` : ''}`;
        
        info.appendChild(title);
        info.appendChild(meta);
        
        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'book-card-actions';

        const pinBtn = document.createElement('button');
        pinBtn.className = `pin-book-btn ${book.pinned ? 'active-pin' : ''}`;
        pinBtn.innerHTML = '📌';
        pinBtn.title = book.pinned ? 'အသေသိမ်းဆည်းမှုကို ပယ်ဖျက်ရန်' : 'စနစ်မှ အလိုအလျောက်မဖျက်စေရန် အသေသိမ်းဆည်းထားမည်';
        pinBtn.onclick = (e) => togglePinBook(book.id, e);
        
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-book-btn';
        delBtn.textContent = '×';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            deleteBook(book.id);
        };
        
        actionsWrapper.appendChild(pinBtn);
        actionsWrapper.appendChild(delBtn);
        
        card.appendChild(info);
        card.appendChild(actionsWrapper);
        shelfList.appendChild(card);
    });
}

function deleteBook(id) {
    if (!confirm("ဤစာအုပ်ကို စာအုပ်စင်မှ ဖျက်ရန် သေချာပါသလားဘုရား?")) return;
    let currentBooks = JSON.parse(localStorage.getItem('room_bookshelf') || '[]');
    currentBooks = currentBooks.filter(b => b.id !== id);
    localStorage.setItem('room_bookshelf', JSON.stringify(currentBooks));
    localStorage.removeItem(`readingPos_${id}`);
    renderBookshelf();
}

/* == READ MODE MANAGEMENT == */
function openBook(book) {
    currentBookId = book.id;
    document.getElementById('upload-dashboard').style.display = 'none';
    document.getElementById('reading-content').style.display = 'block';
    document.getElementById('floating-controls').style.display = 'flex';
    document.getElementById('close-book-btn').style.display = 'block';
    document.getElementById('book-main-title').textContent = book.title;
    
    const bodyContent = document.getElementById('book-body-content');
    bodyContent.textContent = book.content;
    
    buildSemanticParagraphs();
    generateDynamicTOC(book);
    
    triggerLayoutObserver();
    setTimeout(() => { restoreReadingPosition(); }, 150);
}

window.closeCurrentBook = function() {
    saveReadingPosition();
    currentBookId = null;
    document.getElementById('upload-dashboard').style.display = 'block';
    document.getElementById('reading-content').style.display = 'none';
    document.getElementById('floating-controls').style.display = 'none';
    document.getElementById('close-book-btn').style.display = 'none';
    toggleSetting(); 
    renderBookshelf();
    window.scrollTo({ top: 0 });
};

/* == DYNAMIC TOC GENERATION == */
function generateDynamicTOC(book) {
    const tocList = document.getElementById('dynamic-toc-list');
    tocList.innerHTML = '';
    
    if (book.type === 'pdf') {
        const paragraphs = document.querySelectorAll('.raw-text p');
        let pageMarkerParagraphs = {};
        
        paragraphs.forEach(p => {
            const match = p.textContent.match(/\[=== PAGE_(\d+) ===\]/);
            if (match) {
                const pageNum = match[1];
                pageMarkerParagraphs[pageNum] = p;
                p.innerHTML = `<span style="display:block; border-bottom:1px dashed #443300; margin:20px 0; padding-bottom:5px; color:#b38b00; font-size:14px;">📄 စာမျက်နှာ - ${pageNum}</span>`;
            }
        });
        
        for (let i = 1; i <= book.totalPages; i++) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = `စာမျက်နှာ - ${i}`;
            a.onclick = (e) => {
                e.preventDefault();
                const targetP = pageMarkerParagraphs[i];
                if (targetP) {
                    targetP.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    toggleTOC();
                }
            };
            li.appendChild(a);
            tocList.appendChild(li);
        }
    } else {
        const paragraphs = document.querySelectorAll('.raw-text p');
        let step = Math.max(1, Math.floor(paragraphs.length / 10)); 
        
        for (let i = 0; i < paragraphs.length; i += step) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = `အပိုင်း (${Math.floor(i/step) + 1})`;
            a.onclick = (e) => {
                e.preventDefault();
                paragraphs[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
                toggleTOC();
            };
            li.appendChild(a);
            tocList.appendChild(li);
        }
    }
}

/* == INTERFACES & UTILITIES == */
function toggleTOC() {
    const tocOverlay = document.getElementById('toc-overlay');
    if (!tocOverlay) return;
    tocOverlay.style.display = (tocOverlay.style.display !== 'block') ? 'block' : 'none';
}

function toggleSetting() {
    const settingOverlay = document.getElementById('setting-overlay');
    if (!settingOverlay) return;
    settingOverlay.style.display = (settingOverlay.style.display === 'block') ? 'none' : 'block';
}

function downloadPDF() {
    toggleSetting();
    setTimeout(() => { window.print(); }, 500);
}

function toggleReadingMode() {
    document.body.classList.toggle('focus-mode');
    const fsBtn = document.getElementById('fs-btn');
    fsBtn.innerHTML = document.body.classList.contains('focus-mode') ? '✖' : '⛶';
    fsBtn.style.background = document.body.classList.contains('focus-mode') ? 'rgba(234, 222, 188, 0.2)' : 'rgba(234, 222, 188, 0.4)';
}

/* == ORIGINAL LAYOUT CORE SYSTEM == */
function applyLineHeight() {
    const content = document.getElementById('reading-content');
    if (content) content.style.lineHeight = currentLineHeight;
    const lhDisplay = document.getElementById('lh-display');
    if (lhDisplay) lhDisplay.innerText = currentLineHeight.toFixed(1);
    document.querySelectorAll('.line-btn').forEach(btn => {
        btn.classList.toggle('active-preset', parseFloat(btn.dataset.value) === currentLineHeight);
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
        btn.classList.toggle('active-preset', parseFloat(btn.dataset.value) === currentLetterSpacing);
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

/* == MAIN INITIALIZATION == */
function init() {
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
    
    renderBookshelf();

    let readingTimer;
    window.addEventListener('scroll', () => {
        clearTimeout(readingTimer);
        readingTimer = setTimeout(() => { saveReadingPosition(); }, 200);
    });

    const fileInput = document.getElementById('pdf-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) handlePDFUpload(e.target.files[0]);
        });
    }

    document.getElementById('font-increase').onclick = () => changeFontSize(1);
    document.getElementById('font-decrease').onclick = () => changeFontSize(-1);
    document.getElementById('size-plus-10').onclick = () => changeFontSize(10);
    document.getElementById('size-minus-10').onclick = () => changeFontSize(-10);
    document.getElementById('size-plus-11').onclick = () => changeFontSize(1);
    document.getElementById('size-minus-11').onclick = () => changeFontSize(-1);

    document.querySelectorAll('.line-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            saveReadingPosition();
            currentLineHeight = parseFloat(btn.dataset.value);
            triggerLayoutObserver();
            applyLineHeight();
        });
    });

    document.querySelectorAll('.letter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            saveReadingPosition();
            currentLetterSpacing = parseFloat(btn.dataset.value);
            triggerLayoutObserver();
            applyLetterSpacing();
        });
    });

    document.querySelectorAll('#weight-buttons .preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            saveReadingPosition();
            currentWeight = parseInt(btn.dataset.weight);
            triggerLayoutObserver();
            renderWeight();
        });
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
            const val = tocSearch.value.toLowerCase();
            document.querySelectorAll('#dynamic-toc-list li').forEach(item => {
                item.style.display = item.textContent.toLowerCase().includes(val) ? 'block' : 'none';
            });
        });
    }

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
