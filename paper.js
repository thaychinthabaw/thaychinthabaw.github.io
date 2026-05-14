/* ========================= SEMANTIC SYSTEM ========================= */
function buildSemanticParagraphs() {
    const containers = document.querySelectorAll('.raw-text');
    let globalIndex = 1; 
    containers.forEach((container) => {
        const rawText = container.innerText.trim();
        const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim() !== '');
        container.innerHTML = ''; 
        paragraphs.forEach((text) => {
            const p = document.createElement('p');
            p.setAttribute('data-p', globalIndex); 
            p.textContent = text.trim();
            container.appendChild(p);
            globalIndex++;
        });
    });
}

function saveReadingPosition() {
    const paragraphs = document.querySelectorAll('.raw-text p');
    let currentParagraph = null;
    paragraphs.forEach(p => {
        const rect = p.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < window.innerHeight * 0.35) {
            currentParagraph = p.dataset.p;
        }
    });
    if (currentParagraph) {
        localStorage.setItem('readingPosition', JSON.stringify({
            paragraph: currentParagraph
        }));
    }
}

function restoreReadingPosition() {
    const saved = localStorage.getItem('readingPosition');
    if (!saved) return;
    const data = JSON.parse(saved);
    setTimeout(() => {
        const target = document.querySelector(`[data-p="${data.paragraph}"]`);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 600);
}

// ခလုတ်များ အလုပ်လုပ်ရန် လိုအပ်သော Variable (မဖျက်ပါနဲ့ဘုရား)
let currentFontSize = 25; 

// ၁။ မာတိကာ (Table of Contents) အဖွင့်အပိတ် (Auto-scroll အသစ်ပါဝင်သည်)
function toggleTOC() {
    const tocOverlay = document.getElementById('toc-overlay');
    if (tocOverlay) {
        const isOpening = tocOverlay.style.display !== 'block';
        
        if (isOpening) {
            tocOverlay.style.display = 'block';
            
            // မာတိကာပွင့်ပြီးနောက် Active ဖြစ်နေသော အခန်းဆီသို့ အလိုအလျောက် Scroll ဆွဲခြင်း
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
}


// ၂။ Setting Menu အဖွင့်အပိတ်
function toggleSetting() {
    const settingOverlay = document.getElementById('setting-overlay');
    if (settingOverlay) {
        const isVisible = settingOverlay.style.display === 'block';
        settingOverlay.style.display = isVisible ? 'none' : 'block';
    }
}

// ၃။ PDF ဖိုင်ဒေါင်းလော့ဆွဲရန် (အသစ်ထည့်လိုက်သည့်နေရာ)
function downloadPDF() {
    toggleSetting(); 
    setTimeout(() => {
        window.print(); 
    }, 500);
}

// ၅။ ဖတ်လက်စစာမျက်နှာကို မှတ်ထားပေးရန်
function saveCurrentPage() {
    localStorage.setItem('lastReadTitle', document.title);
    localStorage.setItem('lastReadUrl', window.location.href);
}

// ၆။ ပြန်လည်ဖတ်ရှုရန် ခလုတ်ပြသခြင်း
function showLastReadLink() {
    const lastTitle = localStorage.getItem('lastReadTitle');
    const lastUrl = localStorage.getItem('lastReadUrl');
    const lastReadContainer = document.getElementById('last-read-container');

    if (lastTitle && lastUrl && window.location.href !== lastUrl && lastReadContainer) {
        lastReadContainer.innerHTML = `
            <div style="background: #eadebc; border: 1px solid #443300; padding: 15px; margin: 10px; border-radius: 8px; text-align:center;">
                <p style="color: #443300; font-size: 14px; margin-bottom: 5px;">သင်နောက်ဆုံး ဖတ်လက်စအပိုင်း -</p>
                <a href="${lastUrl}" style="color: #443300; font-weight: bold; text-decoration: none;">
                   📖 ${lastTitle} သို့ ပြန်သွားရန်
                </a>
            </div>
        `;
    }
}

// စာမျက်နှာ Load ဖြစ်ချိန်တွင် အလုပ်လုပ်ရန် လုပ်ထားသည်
window.addEventListener('load', function() {
    const savedSize = localStorage.getItem('userFontSize');
    const contentArea = document.getElementById('reading-content');
    const display = document.getElementById('font-size-display');

    if (savedSize && contentArea) {
        currentFontSize = parseInt(savedSize);
        contentArea.style.fontSize = currentFontSize + 'px';
        if (display) {
            display.innerText = currentFontSize;
        }
    }

    saveCurrentPage();
    showLastReadLink();
});


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

// စာမျက်နှာ စဖွင့်တာနဲ့ အလုပ်လုပ်မည့်အပိုင်း
window.addEventListener('DOMContentLoaded', () => {
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

    sections.forEach(section => observer.observe(section));

    window.addEventListener('scroll', () => {
        if (window.scrollY < 100) {
            tocLinks.forEach(link => link.classList.remove('active-chapter'));
            const introLink = document.querySelector('.toc-list li a[href="#intro"]');
            if (introLink) {
                introLink.classList.add('active-chapter');
                localStorage.setItem('lastReadChapter', 'intro');
            }
        }
    });

    // ဖတ်လက်စနေရာသို့ ပြန်သွားရန်
    buildSemanticParagraphs(); 
    restoreReadingPosition();  

    let readingTimer;
    window.addEventListener('scroll', () => {
        clearTimeout(readingTimer);
        readingTimer = setTimeout(() => {
            saveReadingPosition();
        }, 200);
    });
});


// paper.html ထဲတွင် ဖိထားမှ စာရွေးလို့ ရမဲ့ကုဒ် အစ
document.addEventListener("DOMContentLoaded", function() {
    const content = document.querySelector('article'); 
    let timer;
    let isLongPressed = false;
    let startX, startY; 

    if (content) {
        content.addEventListener('touchstart', function(e) {
            isLongPressed = false;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            
            timer = setTimeout(function() {
                isLongPressed = true;
                content.style.webkitUserSelect = 'text';
                content.style.userSelect = 'text';
            }, 500);
        });

        content.addEventListener('touchmove', function(e) {
            let moveX = e.touches[0].clientX;
            let moveY = e.touches[0].clientY;
            
            if (Math.abs(moveX - startX) > 10 || Math.abs(moveY - startY) > 10) {
                clearTimeout(timer);
            }
        });

        content.addEventListener('touchend', function(e) {
            clearTimeout(timer);
            if (!isLongPressed) {
                if (window.getSelection().toString() === "") {
                    content.style.webkitUserSelect = 'none';
                    content.style.userSelect = 'none';
                }
            }
        });

        document.addEventListener('click', function(e) {
            if (!content.contains(e.target)) {
                content.style.webkitUserSelect = 'none';
                content.style.userSelect = 'none';
                window.getSelection().removeAllRanges();
            }
        });
    }
});
// paper.html ထဲတွင် ဖိထားမှ စာရွေးလို့ ရမဲ့ကုဒ် အဆုံး               


/* =========================
   LINE HEIGHT SYSTEM
========================= */

let currentLineHeight = 2.0;
const lineButtons = document.querySelectorAll('.line-btn');

function applyLineHeight() {
    const content = document.getElementById('reading-content');
    if (content) { content.style.lineHeight = currentLineHeight; }
    document.getElementById('lh-display').innerText = currentLineHeight.toFixed(1);
    lineButtons.forEach(btn => {
        btn.classList.remove('active-preset');
        if (parseFloat(btn.dataset.value) === currentLineHeight) {
            btn.classList.add('active-preset');
        }
    });
    localStorage.setItem('userLineHeight', currentLineHeight);
}

function adjustLineHeight(amount) {
    let next = Math.round((currentLineHeight + amount) * 10) / 10;
    if (next >= 1.0 && next <= 3.0) {
        currentLineHeight = next;
        applyLineHeight();
    }
}

lineButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        currentLineHeight = parseFloat(btn.dataset.value);
        applyLineHeight();
    });
});


/* =========================
   LETTER SPACING SYSTEM
========================= */

let currentLetterSpacing = 0;
const letterButtons = document.querySelectorAll('.letter-btn');

function applyLetterSpacing() {
    const content = document.getElementById('reading-content');
    if (content) { content.style.letterSpacing = currentLetterSpacing + 'px'; }
    document.getElementById('ls-display').innerText = currentLetterSpacing;
    letterButtons.forEach(btn => {
        btn.classList.remove('active-preset');
        if (parseFloat(btn.dataset.value) === currentLetterSpacing) {
            btn.classList.add('active-preset');
        }
    });
    localStorage.setItem('userLetterSpacing', currentLetterSpacing);
}

function adjustLetterSpacing(amount) {
    let next = Math.round((currentLetterSpacing + amount) * 10) / 10;
    if (next >= 0 && next <= 10) {
        currentLetterSpacing = next;
        applyLetterSpacing();
    }
}

letterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        currentLetterSpacing = parseFloat(btn.dataset.value);
        applyLetterSpacing();
    });
});


/* =========================
   LOAD SAVED SETTINGS
========================= */

window.addEventListener('DOMContentLoaded', () => {
    const savedLH = localStorage.getItem('userLineHeight');
    if (savedLH !== null) { currentLineHeight = parseFloat(savedLH); }
    applyLineHeight();

    const savedLS = localStorage.getItem('userLetterSpacing');
    if (savedLS !== null) { currentLetterSpacing = parseFloat(savedLS); }
    applyLetterSpacing();
});


// ===== Optimized Font System =====

document.addEventListener('DOMContentLoaded', () => {
    const article = document.querySelector('article');
    const fontDisplay = document.getElementById('font-size-display');
    let fontSize = parseInt(localStorage.getItem('userFontSize')) || 25;

    function renderFontSize() {
        article.style.fontSize = fontSize + 'px';
        fontDisplay.textContent = fontSize;
        localStorage.setItem('userFontSize', fontSize);
    }

    // Font size controls
    const sizeTens = document.getElementById('size-tens');
    const sizeOnes = document.getElementById('size-ones');

    function renderSizeDigits() {
        if(sizeTens) sizeTens.textContent = Math.floor(fontSize / 10);
        if(sizeOnes) sizeOnes.textContent = fontSize % 10;
    }

    function changeFontSize(amount) {
        const next = fontSize + amount;
        if (next >= 10 && next <= 70) {
            fontSize = next;
            renderFontSize();
            renderSizeDigits();
        }
    }

    if(document.getElementById('size-plus-10')) document.getElementById('size-plus-10').onclick = () => changeFontSize(10);
    if(document.getElementById('size-minus-10')) document.getElementById('size-minus-10').onclick = () => changeFontSize(-10);
    if(document.getElementById('size-plus-1')) document.getElementById('size-plus-1').onclick = () => changeFontSize(1);
    if(document.getElementById('size-minus-1')) document.getElementById('size-minus-1').onclick = () => changeFontSize(-1);

    renderFontSize();
    renderSizeDigits();

    // ===== FONT WEIGHT =====
    let currentWeight = parseInt(localStorage.getItem('userFontWeight')) || 500;
    const weightButtons = document.querySelectorAll('#weight-buttons .preset-btn');
    const hundreds = document.getElementById('digit-hundreds');
    const tens = document.getElementById('digit-tens');
    const ones = document.getElementById('digit-ones');

    function renderWeight() {
        article.style.fontWeight = currentWeight;
        if(hundreds) hundreds.textContent = Math.floor(currentWeight / 100);
        if(tens) tens.textContent = Math.floor((currentWeight % 100) / 10);
        if(ones) ones.textContent = currentWeight % 10;

        weightButtons.forEach(btn => {
            btn.classList.toggle('active-preset', parseInt(btn.dataset.weight) === currentWeight);
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

    weightButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentWeight = parseInt(btn.dataset.weight);
            renderWeight();
        });
    });

    if(document.getElementById('weight-plus-100')) document.getElementById('weight-plus-100').onclick = () => changeWeight(100);
    if(document.getElementById('weight-minus-100')) document.getElementById('weight-minus-100').onclick = () => changeWeight(-100);
    if(document.getElementById('weight-plus-10')) document.getElementById('weight-plus-10').onclick = () => changeWeight(10);
    if(document.getElementById('weight-minus-10')) document.getElementById('weight-minus-10').onclick = () => changeWeight(-10);
    if(document.getElementById('weight-plus-1')) document.getElementById('weight-plus-1').onclick = () => changeWeight(1);
    if(document.getElementById('weight-minus-1')) document.getElementById('weight-minus-1').onclick = () => changeWeight(-1);

    renderWeight();
});


/* =========================
   TOC SEARCH အစ
========================= */

const tocSearch = document.getElementById("toc-search");
const tocItems = document.querySelectorAll(".toc-list li");

function clearTOCSearch() {
    if(tocSearch) tocSearch.value = "";
    tocItems.forEach(item => { item.style.display = "block"; });
}

if(tocSearch) {
    tocSearch.addEventListener("input", () => {
        const searchText = tocSearch.value.toLowerCase();
        tocItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchText) ? "block" : "none";
        });
    });
}

tocItems.forEach(item => {
    const link = item.querySelector("a");
    if (link) {
        link.addEventListener("click", () => {
            clearTOCSearch();
            document.getElementById('toc-overlay').style.display = 'none';
        });
    }
});


/* =========================
   TOC TOP / BOTTOM BUTTONS
========================= */

const tocTopBtn = document.getElementById("toc-top-btn");
const tocBottomBtn = document.getElementById("toc-bottom-btn");
const tocContent = document.querySelector(".toc-list");

if(tocTopBtn) {
    tocTopBtn.addEventListener("click", () => {
        tocContent.scrollTo({ top: 0, behavior: "smooth" });
    });
}

if(tocBottomBtn) {
    tocBottomBtn.addEventListener("click", () => {
        tocContent.scrollTo({ top: tocContent.scrollHeight, behavior: "smooth" });
    });
}

/* TOC SEARCH အဆုံး */
