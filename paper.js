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

// Global Variables
let currentFontSize = 25; // ဒီနေရာမှာ ကြေညာပေးလိုက်လို့ အားလုံး အလုပ်လုပ်သွားပါပြီ

// ၁။ မာတိကာ (Table of Contents) အဖွင့်အပိတ်
function toggleTOC() {
    const tocOverlay = document.getElementById('toc-overlay');
    if (tocOverlay) {
        const isOpening = tocOverlay.style.display !== 'block';
        if (isOpening) {
            tocOverlay.style.display = 'block';
            setTimeout(() => {
                const activeItem = document.querySelector('.active-chapter');
                const tocList = document.querySelector('.toc-list');
                if (activeItem && tocList) {
                    activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

// ၃။ PDF ဖိုင်ဒေါင်းလော့ဆွဲရန်
function downloadPDF() {
    toggleSetting();
    setTimeout(() => { window.print(); }, 500);
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
            </div>`;
    }
}

// စာမျက်နှာ Load ဖြစ်ချိန်တွင် အလုပ်လုပ်ရန်
window.addEventListener('load', function() {
    const savedSize = localStorage.getItem('userFontSize');
    const contentArea = document.getElementById('reading-content');
    const display = document.getElementById('font-size-display');
    if (savedSize && contentArea) {
        currentFontSize = parseInt(savedSize);
        contentArea.style.fontSize = currentFontSize + 'px';
        if (display) display.innerText = currentFontSize;
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

// DOMContentLoaded အပိုင်း (TOC, Scrolling, and Paragraph Restoration)
window.addEventListener('DOMContentLoaded', () => {
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

// စာဖိရွေးသည့်စနစ်
document.addEventListener("DOMContentLoaded", function() {
    const content = document.querySelector('article'); 
    let timer, isLongPressed = false, startX, startY; 
    if (content) {
        content.addEventListener('touchstart', function(e) {
            isLongPressed = false;
            startX = e.touches[0].clientX; startY = e.touches[0].clientY;
            timer = setTimeout(function() {
                isLongPressed = true;
                content.style.webkitUserSelect = 'text'; content.style.userSelect = 'text';
            }, 500);
        });
        content.addEventListener('touchmove', function(e) {
            let moveX = e.touches[0].clientX, moveY = e.touches[0].clientY;
            if (Math.abs(moveX - startX) > 10 || Math.abs(moveY - startY) > 10) clearTimeout(timer);
        });
        content.addEventListener('touchend', function(e) {
            clearTimeout(timer);
            if (!isLongPressed && window.getSelection().toString() === "") {
                content.style.webkitUserSelect = 'none'; content.style.userSelect = 'none';
            }
        });
        document.addEventListener('click', function(e) {
            if (!content.contains(e.target)) {
                content.style.webkitUserSelect = 'none'; content.style.userSelect = 'none';
                window.getSelection().removeAllRanges();
            }
        });
    }
});

/* Line Height & Letter Spacing System */
let currentLineHeight = 2.0;
let currentLetterSpacing = 0;

function applyLineHeight() {
    const content = document.getElementById('reading-content');
    if (content) content.style.lineHeight = currentLineHeight;
    const disp = document.getElementById('lh-display');
    if (disp) disp.innerText = currentLineHeight.toFixed(1);
    localStorage.setItem('userLineHeight', currentLineHeight);
}

function applyLetterSpacing() {
    const content = document.getElementById('reading-content');
    if (content) content.style.letterSpacing = currentLetterSpacing + 'px';
    const disp = document.getElementById('ls-display');
    if (disp) disp.innerText = currentLetterSpacing;
    localStorage.setItem('userLetterSpacing', currentLetterSpacing);
}

// Initializing Settings
window.addEventListener('DOMContentLoaded', () => {
    const savedLH = localStorage.getItem('userLineHeight');
    if (savedLH) currentLineHeight = parseFloat(savedLH);
    applyLineHeight();
    const savedLS = localStorage.getItem('userLetterSpacing');
    if (savedLS) currentLetterSpacing = parseFloat(savedLS);
    applyLetterSpacing();
});

// Font size adjustments (Simplified)
function changeFontSize(amount) {
    const contentArea = document.getElementById('reading-content');
    const display = document.getElementById('font-size-display');
    const next = currentFontSize + amount;
    if (next >= 10 && next <= 70 && contentArea) {
        currentFontSize = next;
        contentArea.style.fontSize = currentFontSize + 'px';
        if (display) display.innerText = currentFontSize;
        localStorage.setItem('userFontSize', currentFontSize);
    }
}

// TOC Search Logic
const tocSearch = document.getElementById("toc-search");
const tocItems = document.querySelectorAll(".toc-list li");

function clearTOCSearch() {
    if (tocSearch) tocSearch.value = "";
    tocItems.forEach(item => item.style.display = "block");
}

if (tocSearch) {
    tocSearch.addEventListener("input", () => {
        const searchText = tocSearch.value.toLowerCase();
        tocItems.forEach(item => {
            item.style.display = item.textContent.toLowerCase().includes(searchText) ? "block" : "none";
        });
    });
}
