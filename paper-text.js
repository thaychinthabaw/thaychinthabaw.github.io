(() => {
'use strict';

/* == GLOBAL CONFIGURATION & SYSTEM STATE == */
let currentLineHeight = 2.0;
let currentLetterSpacing = 0;
let restoreTimer = null;
let fontResizeObserver = null;

// 📚 စာအုပ်စင် Array Array State (အများဆုံး ၁၀ အုပ် သိမ်းဆည်းရန်)
let bookShelf = []; 

/* == SEMANTIC ANALYSIS LAYOUT ENGINE == */
function buildSemanticParagraphs() {
    const containers = document.querySelectorAll('.raw-text');
    let globalIndex = 1;
    containers.forEach((container) => {
        const rawText = container.textContent.trim();
        if (!rawText || rawText.startsWith("စာဖတ်ခန်းထဲတွင် စာမူမရှိသေးပါ")) {
            return;
        }
        const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim() !== '');
        container.innerHTML = '';
        paragraphs.forEach((text) => {
            const cleanText = text.trim();
            // ===== GAP FLOW HANDLING =====
            if (cleanText === '@@gap') {
                const gap = document.createElement('div');
                gap.className = 'big-gap';
                container.appendChild(gap);
                return;
            }
            // ===== STRUCTURE PARAGRAPH BLOCK =====
            const p = document.createElement('p');
            p.setAttribute('data-p', globalIndex);
            p.textContent = cleanText;
            container.appendChild(p);
            globalIndex++;
        });
    });
}

/* == ADVANCED MEMORY SCROLL POSITION TRACKER == */
function saveReadingPosition() {
    const activeBook = localStorage.getItem('activeBookId');
    if (!activeBook) return; // စာဖတ်ခန်း ရှင်းလင်းထားပါက ရွေ့လျားမှု သိမ်းဆည်းရန် မလိုပါ

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
            `readingPosition_${activeBook}`,
            JSON.stringify({
                paragraph: currentParagraph,
                offsetRatio: offsetRatio
            })
        );
    }
}

function restoreReadingPosition() {
    const activeBook = localStorage.getItem('activeBookId');
    if (!activeBook) return;

    const saved = localStorage.getItem(`readingPosition_${activeBook}`);
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

/* == BOOKSHELF INTERACTION & STORAGE UTILITIES (FIFO ENGINE) == */
function loadBookshelfFromStorage() {
    const savedShelf = localStorage.getItem('thaychin_bookshelf');
    try {
        bookShelf = savedShelf ? JSON.parse(savedShelf) : [];
    } catch (e) {
        bookShelf = [];
    }
}

function saveBookshelfToStorage() {
    localStorage.setItem('thaychin_bookshelf', JSON.stringify(bookShelf));
    calculateStorageSpace();
}

// 🧮 Storage ပမာဏ သတိပေးချက်တွက်ချက်မှုစနစ် (5MB LocalStorage ဖြင့် အချိုးချတွက်ချက်ခြင်း)
function calculateStorageSpace() {
    let totalChars = 0;
    bookShelf.forEach(book => {
        totalChars += (book.title.length + book.content.length);
    });
    // 1 Character လျှင် ခန့်မှန်းခြေ 2 Bytes နှုန်းဖြင့် 5MB (5,242,880 Bytes) ပေါ်တွင် တွက်ချက်ခြင်း
    const estimatedBytes = totalChars * 2;
    const maxBytes = 5 * 1024 * 1024;
    let percentage = Math.ceil((estimatedBytes / maxBytes) * 100);
    if (percentage > 100) percentage = 100;

    const display = document.getElementById('storage-usage-display');
    if (display) {
        display.textContent = `Storage သုံးစွဲမှု - ${percentage}%`;
        if (percentage >= 85) {
            display.style.color = '#cc0000';
        } else {
            display.style.color = '#443300';
        }
    }
}

// 📦 စာအုပ်အသစ် သိမ်းဆည်းခြင်း Logic (FIFO - အများဆုံး ၁၀ အုပ် ကန့်သတ်ချက်)
function addNewBookToShelf(title, content) {
    const bookId = 'book_' + Date.now();
    
    // ခေါင်းစဉ် အလိုအလျောက် ဖြတ်တောက်ခြင်း (၁၅ လုံး ကန့်သတ်ချက်)
    let cleanTitle = title.trim();
    if (cleanTitle.length > 15) {
        cleanTitle = cleanTitle.substring(0, 15) + '...';
    }

    const newBook = {
        id: bookId,
        title: cleanTitle,
        content: content,
        timestamp: Date.now()
    };

    // FIFO Logic: စာအုပ်စင်ထဲတွင် တူညီသော ခေါင်းစဉ် ရှိမရှိ စစ်ဆေးပြီး ရှိပါက ၎င်းအား အရင်ဖျက်ထုတ်မည်
    bookShelf = bookShelf.filter(b => b.title !== cleanTitle);

    // အကယ်၍ ၁၀ အုပ် ပြည့်နေပါက သက်တမ်းအကြာဆုံး (ပထမဆုံးဝင်ခဲ့သော) ဖိုင်အား ရှင်းထုတ်မည်
    if (bookShelf.length >= 10) {
        bookShelf.shift(); 
    }

    bookShelf.push(newBook);
    saveBookshelfToStorage();
    
    // ထည့်သွင်းပြီးပါက လက်ရှိ စာအုပ်သစ်အား အလိုအလျောက် တန်းပွင့်စေမည်
    activateBook(bookId);
}

// 🎯 ရွေးချယ်လိုက်သည့် စာအုပ်အား စာဖတ်ခန်းထဲသို့ ဆွဲတင်ခြင်း (Recently Read Sorting)
function activateBook(bookId) {
    loadBookshelfFromStorage();
    const bookIndex = bookShelf.findIndex(b => b.id === bookId);
    if (bookIndex === -1) return;

    const selectedBook = bookShelf[bookIndex];

    // Recently Read Sorting Logic: နှိပ်လိုက်သည့် စာအုပ်ကို list ၏ နောက်ဆုံး (ထိပ်ဆုံးပေါ်ရန်) သို့ ရွှေ့ပြောင်းခြင်း
    bookShelf.splice(bookIndex, 1);
    bookShelf.push(selectedBook);
    saveBookshelfToStorage();

    localStorage.setItem('activeBookId', bookId);

    const container = document.querySelector('.raw-text');
    if (container) {
        container.textContent = selectedBook.content;
        buildSemanticParagraphs();
        // Browser အမြင့်အစစ်အမှန် တွက်ချက်ပြီးမှ Scroll နေရာပြန်ချပေးရန် စောင့်ကြည့်ခြင်း
        triggerLayoutObserver();
    }
    
    renderBookshelfUI();
}

// 🗑️ စာအုပ်တစ်အုပ်ချင်းစီ အပြီးတိုင် ဖျက်ပစ်ခြင်း (Delete Functional Logic)
function deleteBookFromShelf(bookId, event) {
    if (event) event.stopPropagation(); // Card Click Action နှင့် မငြိစေရန် တားဆီးခြင်း
    
    bookShelf = bookShelf.filter(b => b.id !== bookId);
    saveBookshelfToStorage();

    const activeBookId = localStorage.getItem('activeBookId');
    if (activeBookId === bookId) {
        unloadCurrentBookView(); // ဖတ်လက်စ စာအုပ်အား ဖျက်လိုက်ပါက စာဖတ်ခန်းကိုပါ တစ်ခါတည်း ရှင်းပစ်မည်
    } else {
        renderBookshelfUI();
    }
}

// ❌ က ပုံစံ - စာဖတ်ခန်း ခေတ္တရှင်းလင်းရေး (Close Current View)
function unloadCurrentBookView() {
    localStorage.removeItem('activeBookId');
    const container = document.querySelector('.raw-text');
    if (container) {
        container.innerHTML = 'စာဖတ်ခန်းထဲတွင် စာမူမရှိသေးပါ။ ညာဘက်အပေါ်ရှိ Setting (⚙️) ကိုနှိပ်၍ စာသားထည့်သွင်းခြင်း သို့မဟုတ် ဖိုင်တင်သွင်းခြင်း ပြုလုပ်ပေးပါရန်။';
    }
    renderBookshelfUI();
}

// ⚠️ Factory Reset - စာအုပ်စင်တစ်ခုလုံးအား တစ်ချက်တည်းဖြင့် ရှင်းလင်းပစ်ခြင်း
function clearAllBookshelfData() {
    const confirmAction = confirm("သတိပေးချက်- စာအုပ်စင်ပေါ်ရှိ စာမူများအားလုံး လုံးဝ (လုံးဝ) ပျက်သွားပါလိမ့်မည်။ အကုန်ဖျက်ရန် သေချာပါသလားဗျာ။");
    if (!confirmAction) return;

    // LocalStorage သက်ဆိုင်ရာ Key များအားလုံး အပြီးတိုင် ဖျက်ဆီးခြင်း
    bookShelf.forEach(book => {
        localStorage.removeItem(`readingPosition_${book.id}`);
    });
    localStorage.removeItem('thaychin_bookshelf');
    localStorage.removeItem('activeBookId');
    
    bookShelf = [];
    calculateStorageSpace();
    unloadCurrentBookView();
    toggleSetting();
}

// 🖥️ HTML UI Rendering Control for Bookshelf List
function renderBookshelfUI() {
    const box = document.getElementById('recent-file-box');
    if (!box) return;

    if (bookShelf.length === 0) {
        box.innerHTML = '<div style="text-align:center; color:#776633; padding:10px; font-size:14px;">စာအုပ်စင်ပေါ်တွင် စာအုပ်မရှိသေးပါ။</div>';
        return;
    }

    const activeBookId = localStorage.getItem('activeBookId');
    
    // HTML Element Cards တည်ဆောက်ခြင်း (အသစ်များကို ထိပ်ဆုံးမှ ပြသရန် reverse ပြုလုပ်သည်)
    let htmlMarkup = '';
    const displayList = [...bookShelf].reverse();

    displayList.forEach(book => {
        // Active Bookmark Logic: လက်ရှိ ဖတ်နေဆဲ စာအုပ်ဖြစ်ပါက active-card-highlight configuration ထည့်သွင်းပေးမည်
        const isActive = book.id === activeBookId;
        const activeClass = isActive ? 'active-card-highlight' : '';
        const activeIndicator = isActive ? '● ဖတ်နေဆဲ - ' : '📖 ';

        htmlMarkup += `
            <div class="bookshelf-card ${activeClass}" onclick="window.activateBook('${book.id}')">
                <div class="bookshelf-card-info">
                    <span class="bookshelf-card-title">${activeIndicator}${book.title}</span>
                </div>
                <button class="bookshelf-delete-btn" onclick="window.deleteBookFromShelf('${book.id}', event)" title="အပြီးဖျက်ရန်">❌ ਫျက်ရန်</button>
            </div>
        `;
    });

    box.innerHTML = htmlMarkup;
    calculateStorageSpace();
}

/* == INTERFACE TOGGLE MANAGEMENT == */
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
    if (!isVisible) {
        renderBookshelfUI(); // စက်တင်ဖွင့်လိုက်တိုင်း စာအုပ်စင် အခြေအနေအား Update လုပ်ပေးခြင်း
    }
}

function downloadPDF() {
    toggleSetting();
    setTimeout(() => { window.print(); }, 500);
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

/* == CORE TYPOGRAPHY DISPLAY ADJUSTMENT SYSTEM == */
function applyLineHeight() {
    const content = document.getElementById('reading-content');
    if (content) content.style.lineHeight = currentLineHeight;
    const lhDisplay = document.getElementById('lh-display');
    if (lhDisplay) lhDisplay.innerText = currentLineHeight.toFixed(1);
    
    document.querySelectorAll('.line-btn').forEach(btn => {
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
        triggerLayoutObserver();
        applyLetterSpacing();
    }
}

let fontSize = parseInt(localStorage.getItem('userFontSize')) || 25;
function renderFontSize() {
    const articleElement = document.querySelector('article');
    if (articleElement) articleElement.style.fontSize = fontSize + 'px';
    const fontDisplay = document.getElementById('font-size-display');
    if (fontDisplay) fontDisplay.textContent = fontSize;
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

function clearTOCSearch() {
    const tocSearch = document.getElementById('toc-search');
    if (tocSearch) tocSearch.value = '';
    document.querySelectorAll('.toc-list li').forEach(item => { item.style.display = 'block'; });
}

/* ===== INPUT DATA HANDLING (PASTE SYSTEM) ===== */
function handlePasteRead() {
    const input = document.getElementById('paste-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) {
        alert('စာသားမရှိသေးပါဗျာ');
        return;
    }
    
    // Paste လုပ်သော စာသားများအား ရှေ့ဆုံးစာလုံး ၁၅ လုံးဖြင့် ခေါင်းစဉ်တပ်၍ သိမ်းဆည်းမည်
    let generatedTitle = text.substring(0, 15);
    addNewBookToShelf(generatedTitle || "Pasted Text", text);
    
    input.value = ''; // ရှင်းလင်းပေးခြင်း
    toggleSetting();
}

/* ===== ADVANCED DOCUMENT PARSING HANDLING (TXT & PDF SYSTEM) ===== */
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const fileName = file.name;
    const container = document.querySelector('.raw-text');
    if (!container) return;

    /* ===== (က) TEXT CHANNELS PROCESSOR ===== */
    if (file.type === 'text/plain' || fileName.endsWith('.txt')) {
        const text = await file.text();
        addNewBookToShelf(fileName, text);
        toggleSetting();
    }
    /* ===== (ခ) PDF CHANNELS PROCESSOR (WITH PROGRESS & TIMEOUT ALERT) ===== */
    else if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
        if (typeof pdfjsLib === 'undefined') {
            alert('PDF Support Framework မချိတ်ဆက်ရသေးပါဗျာ');
            return;
        }

        // ⏳ Loading Indicator စတင်ပြသခြင်း
        container.innerHTML = `<div class="pdf-loading-indicator">⏳ PDF ဖိုင်ကို ဖတ်နေပါသည်... ခေတ္တစောင့်ဆိုင်းပေးပါ...</div>`;
        toggleSetting(); // ပေါ်လာသော စာသားကို မြင်နိုင်ရန် Panel ပိတ်ပေးခြင်း

        const reader = new FileReader();
        reader.onload = async function() {
            try {
                const typedarray = new Uint8Array(this.result);
                
                // Engine Task အား စတင်စောင့်ကြည့်ခြင်း
                const loadingTask = pdfjsLib.getDocument(typedarray);
                const pdf = await loadingTask.promise;
                let fullText = '';

                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n\n';
                }

                // ❌ တက်လာသည့် ရလဒ် စာသားမရှိပါက (ရုပ်ပုံသီးသန့် Scanned PDF ဖြစ်ပါက) Alert ပေးခြင်း
                if (!fullText.trim()) {
                    unloadCurrentBookView();
                    alert('❌ စာသားများကို ဖတ်၍မရပါ (ဓာတ်ပုံရိုက်ထားသည့် PDF ဖြစ်နိုင်ပါသည်)။');
                    return;
                }

                // အောင်မြင်ပါက စာအုပ်စင်ထဲ ထည့်သွင်းသိမ်းဆည်းခြင်း
                addNewBookToShelf(fileName, fullText);

            } catch (error) {
                console.error(error);
                unloadCurrentBookView();
                alert('❌ PDF ဖတ်ယူရာတွင် အမှားအယွင်းရှိသွားပါသည် (သို့မဟုတ် စနစ်က မပံ့ပိုးနိုင်သော ဖိုင်ဖြစ်နိုင်ပါသည်)။');
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert('TXT / PDF ဗားရှင်းဖိုင်များသာ တင်သွင်းနိုင်ပါသည်');
    }
    event.target.value = ''; // Reset file input
}

/* == CORE APP INITIALIZATION ENTRYWAY == */
function init() {
    // ၁။ Load Essential configurations
    loadBookshelfFromStorage();

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

    // ၂။ Auto-Reload Last Active View Document State
    const activeBookId = localStorage.getItem('activeBookId');
    if (activeBookId) {
        const activeBook = bookShelf.find(b => b.id === activeBookId);
        if (activeBook) {
            const container = document.querySelector('.raw-text');
            if (container) container.textContent = activeBook.content;
        }
    }
    
    buildSemanticParagraphs();
    triggerLayoutObserver();

    // ၃။ Active Real-time Scroll Event Listener
    let readingTimer;
    window.addEventListener('scroll', () => {
        clearTimeout(readingTimer);
        readingTimer = setTimeout(() => {
            saveReadingPosition();
        }, 200);
    });

    // ၄။ Operational Buttons Event Wiring
    const pasteBtn = document.getElementById('paste-read-btn');
    if (pasteBtn) pasteBtn.addEventListener('click', handlePasteRead);

    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.addEventListener('change', handleFileUpload);

    const clearViewBtn = document.getElementById('clear-view-btn');
    if (clearViewBtn) clearViewBtn.addEventListener('click', () => {
        unloadCurrentBookView();
        toggleSetting();
    });

    const clearAllBtn = document.getElementById('clear-all-storage-btn');
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllBookshelfData);

    // ၅။ Content Section Anchoring Intersection Observers
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
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => { observer.observe(section); });

    // ၆။ Control Setup Buttons Interfaces
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

    const fontIncrease = document.getElementById('font-increase');
    if (fontIncrease) fontIncrease.onclick = () => { changeFontSize(1); };
    const fontDecrease = document.getElementById('font-decrease');
    if (fontDecrease) fontDecrease.onclick = () => { changeFontSize(-1); };

    const tocTopBtn = document.getElementById('toc-top-btn');
    const tocBottomBtn = document.getElementById('toc-bottom-btn');
    const tocContent = document.querySelector('.toc-list');
    if (tocTopBtn && tocContent) {
        tocTopBtn.addEventListener('click', () => { tocContent.scrollTo({ top: 0, behavior: 'smooth' }); });
    }
    if (tocBottomBtn && tocContent) {
        tocBottomBtn.addEventListener('click', () => { tocContent.scrollTo({ top: tocContent.scrollHeight, behavior: 'smooth' }); });
    }

    const tocSearch = document.getElementById('toc-search');
    if (tocSearch) {
        tocSearch.addEventListener('input', () => {
            const searchText = tocSearch.value.toLowerCase();
            document.querySelectorAll('.toc-list li').forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(searchText) ? 'block' : 'none';
            });
        });
    }

    /* ===== Global Scope Linkage Bindings for Dynamic DOM Nodes ===== */
    window.activateBook = activateBook;
    window.deleteBookFromShelf = deleteBookFromShelf;
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
