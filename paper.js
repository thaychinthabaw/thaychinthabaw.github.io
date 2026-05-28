(() => {
'use strict';
/* ==
   GLOBAL STATE
== */
let currentLineHeight = 2.0;
let currentLetterSpacing = 0;
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
    const paragraphs =
        document.querySelectorAll('.raw-text p');
    let currentParagraph = null;
    let offsetRatio = 0;
    paragraphs.forEach(p => {
        const rect = p.getBoundingClientRect();
        if (
            rect.top <= window.innerHeight * 0.35 &&
            rect.bottom > 0
        ) {
            currentParagraph = p.dataset.p;
            /*
            paragraph အတွင်း user ဘယ်လောက်အောက်ရောက်နေတယ်
            ဆိုတာတွက်ခြင်း
            */
            offsetRatio =
                Math.abs(rect.top)
                / rect.height;     }});
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
    const saved =
        localStorage.getItem('readingPosition');
    if (!saved) return;
    let data;
    try {
        data = JSON.parse(saved);
    } catch {
        return;
    }
    setTimeout(() => {
        const target =
            document.querySelector(
                `[data-p="${data.paragraph}"]`
            );
        if (!target) return;
        /*  paragraph ရဲ့ position */
        const rect =
            target.getBoundingClientRect();
        /*        paragraph အမြင့်        */
        const paragraphHeight =
            target.offsetHeight;
        /*        user ဖတ်ခဲ့တဲ့နေရာ    */
        const offset =
            paragraphHeight
            * (data.offsetRatio || 0);
        /*        final scroll position       */
        const absoluteTop =target.offsetTop;
        const finalY =
              absoluteTop
             + offset
             - 120;
        window.scrollTo({
            top: finalY,
            behavior: 'smooth'
        });
    }, 600);
}
/* == */

    /* ==
   TOGGLE SYSTEM
== */
function toggleTOC() {
    const tocOverlay =
        document.getElementById('toc-overlay');
    if (!tocOverlay) return;
    const isOpening =
        tocOverlay.style.display !== 'block';
    if (isOpening) {
        tocOverlay.style.display = 'block';
        setTimeout(() => {
            const activeItem =
                document.querySelector(
                    '.active-chapter'
                );
            const tocList =
                document.querySelector('.toc-list');
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
    const settingOverlay =
        document.getElementById('setting-overlay');
    if (!settingOverlay) return;
    const isVisible =
        settingOverlay.style.display === 'block';
    settingOverlay.style.display =
        isVisible ? 'none' : 'block';
}
function downloadPDF() {
    toggleSetting();
    setTimeout(() => {
        window.print();
    }, 500);
}
function toggleReadingMode() {
    document.body.classList.toggle('focus-mode');
    const fsBtn =
        document.getElementById('fs-btn');
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
/* ==
   LAST READ SYSTEM
== */
function saveCurrentPage() {
    localStorage.setItem(
        'lastReadTitle',
        document.title
    );
    localStorage.setItem(
        'lastReadUrl',
        window.location.href
    );
}
function showLastReadLink() {
    const lastTitle =
        localStorage.getItem('lastReadTitle');
    const lastUrl =
        localStorage.getItem('lastReadUrl');
    const lastReadContainer =
        document.getElementById(
            'last-read-container'
        );
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
                <a
                    href="${lastUrl}"
                    style="color: #443300; font-weight: bold; text-decoration: none;"
                >
                    📖 ${lastTitle} သို့ ပြန်သွားရန်
                </a>
            </div>
        `;
    }
}
/* ==
   LINE HEIGHT SYSTEM
== */
function applyLineHeight() {
    const content =
        document.getElementById('reading-content');
    if (content) {
        content.style.lineHeight =
            currentLineHeight;
    }
    const lhDisplay = document.getElementById('lh-display');
    if (lhDisplay) {
        lhDisplay.innerText =
            currentLineHeight.toFixed(1);
    }
    const lineButtons =
        document.querySelectorAll('.line-btn');
    lineButtons.forEach(btn => {
        btn.classList.remove('active-preset');
        if (
            parseFloat(btn.dataset.value)
            === currentLineHeight
        ) {
            btn.classList.add('active-preset');
        }
    });
    localStorage.setItem(
        'userLineHeight',
        currentLineHeight
    );
}
function adjustLineHeight(amount) {
    saveReadingPosition();
    let next =
        Math.round(
            (currentLineHeight + amount) * 10
        ) / 10;
    if (next >= 1.0 && next <= 100.0) {
        currentLineHeight = next;
        applyLineHeight();
        setTimeout(() => {
            restoreReadingPosition();
        }, 100);
    }
}
/* ==
   LETTER SPACING SYSTEM
== */
function applyLetterSpacing() {
    const content =
        document.getElementById('reading-content');
    if (content) {
        content.style.letterSpacing =
            currentLetterSpacing + 'px';
    }
    const lsDisplay = document.getElementById('ls-display');
    if (lsDisplay) {
        lsDisplay.innerText = currentLetterSpacing;
    }
    const letterButtons =
        document.querySelectorAll('.letter-btn');
    letterButtons.forEach(btn => {
        btn.classList.remove('active-preset');
        if (
            parseFloat(btn.dataset.value)
            === currentLetterSpacing
        ) {
            btn.classList.add('active-preset');
        }
    });
    localStorage.setItem(
        'userLetterSpacing',
        currentLetterSpacing
    );
}
function adjustLetterSpacing(amount) {
    saveReadingPosition();
    let next =
        Math.round(
            (currentLetterSpacing + amount) * 10
        ) / 10;
    if (next >= 0 && next <= 10) {
        currentLetterSpacing = next;
        applyLetterSpacing();
        setTimeout(() => {
            restoreReadingPosition();
        }, 100);
    }
}
/* ==
   TOC SEARCH
== */
function clearTOCSearch() {
    const tocSearch =
        document.getElementById('toc-search');
    const tocItems =
        document.querySelectorAll('.toc-list li');
    if (tocSearch) {
        tocSearch.value = '';
    }
    tocItems.forEach(item => {
        item.style.display = 'block';
    });
}
/* ==
   MAIN INIT
== */
function init() {
    const article =
        document.querySelector('article');
    const tocSearch =
        document.getElementById('toc-search');
    const tocItems =
        document.querySelectorAll('.toc-list li');
    /* ===== LOAD SAVED SETTINGS ===== */
    const savedLH =
        localStorage.getItem('userLineHeight');
    if (savedLH !== null) {
        currentLineHeight = parseFloat(savedLH);
    }
    applyLineHeight();
    const savedLS =
        localStorage.getItem('userLetterSpacing');
    if (savedLS !== null) {
        currentLetterSpacing = parseFloat(savedLS);
    }
    applyLetterSpacing();
    /* ===== LAST READ ===== */
    saveCurrentPage();
    showLastReadLink();
    /* ===== SEMANTIC ===== */
    buildSemanticParagraphs();
    restoreReadingPosition();
    let readingTimer;
    window.addEventListener('scroll', () => {
        clearTimeout(readingTimer);
        readingTimer = setTimeout(() => {
            saveReadingPosition();
        }, 200);
    });
    /* ===== TOC ACTIVE ===== */
    const sections =
        document.querySelectorAll('section');
    const tocLinks =
        document.querySelectorAll('.toc-list li a');
    const observerOptions = {
        root: null,
        rootMargin: '-10% 0px -70% 0px',
        threshold: 0
    };
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id =
                        entry.target.getAttribute('id');
                    tocLinks.forEach(link => {
                        link.classList.remove(
                            'active-chapter'
                        );
                        if (
                            link.getAttribute('href')
                            === `#${id}`
                        ) {
                            link.classList.add(
                                'active-chapter'
                            );
                            localStorage.setItem(
                                'lastReadChapter',
                                id
                            );
                        }
                    });
                }
            });
        },
        observerOptions
    );
    sections.forEach(section => {
        observer.observe(section);
    });
    /* ===== LINE HEIGHT BUTTONS ===== */
    const lineButtons =
        document.querySelectorAll('.line-btn');
    lineButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentLineHeight =
                parseFloat(btn.dataset.value);
            applyLineHeight();
        });
    });
    /* ===== LETTER SPACING BUTTONS ===== */
    const letterButtons =
        document.querySelectorAll('.letter-btn');
    letterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentLetterSpacing =
                parseFloat(btn.dataset.value);
            applyLetterSpacing();
        });
    });
    /* ===== FONT SIZE SYSTEM ===== */
    let fontSize = parseInt(
        localStorage.getItem('userFontSize')
    ) || 25;
    const articleElement =
        document.querySelector('article');
    function renderFontSize() {
        if (articleElement) {
            articleElement.style.fontSize =
                fontSize + 'px';
        }
        const fontDisplay =
            document.getElementById(
                'font-size-display'
            );
        if (fontDisplay) {
            fontDisplay.textContent = fontSize;
        }
        const sizeTens =
            document.getElementById('size-tens');
        const sizeOnes =
            document.getElementById('size-ones');
        if (sizeTens) {
            sizeTens.textContent =
                Math.floor(fontSize / 10);
        }
        if (sizeOnes) {
            sizeOnes.textContent =
                fontSize % 10;
        }
        localStorage.setItem(
            'userFontSize',
            fontSize
        );
    }
    function changeFontSize(amount) {
    /*
    font size မပြောင်းခင်
    reading position save
    */
    saveReadingPosition();
    const next = fontSize + amount;
    if (next >= 10 && next <= 70) {
        fontSize = next;
        renderFontSize();
        /*
        layout အသစ်ပြီးမှ
        restore ပြန်လုပ်
        */
        setTimeout(() => {
            restoreReadingPosition();
        }, 100);
    }
}
    const fontIncrease =
        document.getElementById('font-increase');
    if (fontIncrease) {
        fontIncrease.onclick = () => {
            changeFontSize(1);
        };
    }
    const fontDecrease =
        document.getElementById('font-decrease');
    if (fontDecrease) {
        fontDecrease.onclick = () => {
            changeFontSize(-1);
        };
    }
    const sizePlus10 =
        document.getElementById('size-plus-10');
    if (sizePlus10) {
        sizePlus10.onclick = () => {
            changeFontSize(10);
        };
    }
    const sizeMinus10 =
        document.getElementById('size-minus-10');
    if (sizeMinus10) {
        sizeMinus10.onclick = () => {
            changeFontSize(-10);
        };
    }
    const sizePlus1 =
        document.getElementById('size-plus-1');
    if (sizePlus1) {
        sizePlus1.onclick = () => {
            changeFontSize(1);
        };
    }
    const sizeMinus1 =
        document.getElementById('size-minus-1');
    if (sizeMinus1) {
        sizeMinus1.onclick = () => {
            changeFontSize(-1);
        };
    }
    renderFontSize();
    /* ===== FONT WEIGHT SYSTEM ===== */
    let currentWeight = parseInt(
        localStorage.getItem('userFontWeight')
    ) || 500;
    const weightButtons =
        document.querySelectorAll(
            '#weight-buttons .preset-btn'
        );
    function renderWeight() {
        if (articleElement) {
            articleElement.style.fontWeight =
                currentWeight;
        }
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
                Math.floor(currentWeight / 100);
        }
        if (tens) {
            tens.textContent =
                Math.floor(
                    (currentWeight % 100) / 10
                );
        }
        if (ones) {
            ones.textContent =
                currentWeight % 10;
        }
        weightButtons.forEach(btn => {
            btn.classList.toggle(
                'active-preset',
                parseInt(btn.dataset.weight)
                === currentWeight
            );
        });
        localStorage.setItem(
            'userFontWeight',
            currentWeight
        );
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
            currentWeight =
                parseInt(btn.dataset.weight);
            renderWeight();
        });
    });
    const weightPlus100 =
        document.getElementById('weight-plus-100');
    if (weightPlus100) {
        weightPlus100.onclick = () => {
            changeWeight(100);
        };
    }
    const weightMinus100 =
        document.getElementById('weight-minus-100');
    if (weightMinus100) {
        weightMinus100.onclick = () => {
            changeWeight(-100);
        };
    }
    const weightPlus10 =
        document.getElementById('weight-plus-10');
    if (weightPlus10) {
        weightPlus10.onclick = () => {
            changeWeight(10);
        };
    }
    const weightMinus10 =
        document.getElementById('weight-minus-10');
    if (weightMinus10) {
        weightMinus10.onclick = () => {
            changeWeight(-10);
        };
    }
    const weightPlus1 =
        document.getElementById('weight-plus-1');
    if (weightPlus1) {
        weightPlus1.onclick = () => {
            changeWeight(1);
        };
    }
    const weightMinus1 =
        document.getElementById('weight-minus-1');
    if (weightMinus1) {
        weightMinus1.onclick = () => {
            changeWeight(-1);
        };
    }
    renderWeight();
    /* ===== TOC TOP/BOTTOM ===== */
    const tocTopBtn =
        document.getElementById('toc-top-btn');
    const tocBottomBtn =
        document.getElementById('toc-bottom-btn');
    const tocContent =
        document.querySelector('.toc-list');
    if (tocTopBtn && tocContent) {
        tocTopBtn.addEventListener('click', () => {
            tocContent.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    if (tocBottomBtn && tocContent) {
        tocBottomBtn.addEventListener('click', () => {
            tocContent.scrollTo({
                top: tocContent.scrollHeight,
                behavior: 'smooth'
            });
        });
    }
    /* ===== TOC SEARCH ===== */
    if (tocSearch) {
        tocSearch.addEventListener('input', () => {
            const searchText =
                tocSearch.value.toLowerCase();
            tocItems.forEach(item => {
                const text =
                    item.textContent.toLowerCase();
                item.style.display =
                    text.includes(searchText)
                    ? 'block'
                    : 'none';
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
                if (
                    window.getSelection().toString()
                    === ''
                ) {
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
}
/* ==
   SINGLE DOMCONTENTLOADED
== */
document.addEventListener(
    'DOMContentLoaded',
    init
);
})();/*SINGLE DOMCONTENTLOADED အဆုံး*/

/* ==
PAPER AUDIO SYSTEM
== */
const paperAudio =
document.getElementById(
'paper-audio'
);

const paperAudioBar =
document.getElementById(
'paper-audio-bar'
);

const paperPlayBtn =
document.getElementById(
'paper-play-btn'
);

const paperSeekbar =
document.getElementById(
'paper-seekbar'
);

const paperVolumeSlider =
document.getElementById(
'paper-volume-slider'
);

const paperVolumeDisplay =
document.getElementById(
'paper-volume-display'
);

const paperNowPlaying =
document.getElementById(
'paper-now-playing'
);

const paperTimeDisplay =
document.getElementById(
'paper-time-display'
);

const paperCloseBtn =
document.getElementById(
'paper-close-btn'
);

const paperMinimizeBtn =
document.getElementById(
'paper-minimize-btn'
);

const paperHideBtn =
document.getElementById(
'paper-hide-btn'
);

const paperShowBarBtn =
document.getElementById(
'paper-show-bar-btn'
);

const paperFasterBtn =
document.getElementById(
'paper-faster-btn'
);

const paperSlowerBtn =
document.getElementById(
'paper-slower-btn'
);

const paperSpeedDisplay =
document.getElementById(
'paper-speed-display'
);

const paperRepeatBtn =
document.getElementById(
'paper-repeat-btn'
);

const paperAutonextBtn =
document.getElementById(
'paper-autonext-btn'
);

const paperPrevBtn =
document.getElementById(
'paper-prev-btn'
);

const paperNextBtn =
document.getElementById(
'paper-next-btn'
);

const paperVoiceBtn =
document.getElementById(
'paper-voice-btn'
);/*အသံကြည်ခလုပ်*/

const paperNightBtn =
document.getElementById(
'paper-night-btn'
);/*ညအသံငြိမ်ခလုပ်*/

/*  SLEEP TIMER  */
const paperSleepInput =
document.getElementById(
    'paper-sleep-input'
);

const paperSleepUnit =
document.getElementById(
    'paper-sleep-unit'
);

const paperSleepStartBtn =
document.getElementById(
    'paper-sleep-start-btn'
);

const paperSleepCancelBtn =
document.getElementById(
    'paper-sleep-cancel-btn'
);

const paperSleepStatus =
document.getElementById(
    'paper-sleep-status'
);/*sleep timerအဆုံး*/

/* ==
STATE
== */
let currentSpeakerButton = null;
let currentSpeed = 1;

/* repeat current audio */
let repeatOne = false;

/* auto next mode */
let autoNextEnabled = false;

/* 🎙 voice clarity */
let voiceModeEnabled = false;

/* 🌙 night listening */
let nightModeEnabled = false;

/* sleep timer */
let sleepTimer = null;

let sleepEndTime = null;

let sleepInterval = null;/* sleep timer */

/* ==VOLUME BOOSTER SYSTEM== */
const audioContext =
new (
window.AudioContext ||
window.webkitAudioContext
)();
const source =
audioContext.createMediaElementSource(
paperAudio
);
const gainNode =
audioContext.createGain();

/* ==
VOICE FILTER SYSTEM
== */
/* 🎙 Voice clarity */
const voiceEQ =
audioContext.createBiquadFilter();
voiceEQ.type = 'peaking';
voiceEQ.frequency.value = 2500;
voiceEQ.Q.value = 1;
voiceEQ.gain.value = 0;

/* 🌙 Night listening */
const nightEQ =
audioContext.createBiquadFilter();
nightEQ.type = 'highshelf';
nightEQ.frequency.value = 3000;
nightEQ.gain.value = 0;

/* == CONNECT == */
source.connect(gainNode);
gainNode.connect(voiceEQ);
voiceEQ.connect(nightEQ);
nightEQ.connect(
audioContext.destination);

/* default volume */
gainNode.gain.value = 1;/* 🌙 Night listening */

/* default */
gainNode.gain.value = 1; /*VOLUME BOOSTER SYSTEM*/

/* ==TOGGLE AUDIO== */
window.togglePaperAudio =
function(
button,
src,
title
) {

/* same audio + playing */
const isSameButton =
currentSpeakerButton === button;

/* ပြင်ဆင်ပြီးကုဒ် - မြန်မာစာလုံးဝှက်ထားတာတွေကို ပြန်ဖြေပြီးမှ စစ်ဆေးခြင်း */
const isSameAudio =
decodeURI(paperAudio.src).includes(src); 
    
/* same button + same audio + playing */
if (
isSameButton &&
isSameAudio &&
!paperAudio.paused
) {
paperAudio.pause();
paperAudioBar.style.display =
'none';
paperShowBarBtn.style.display =
'none';
button.innerHTML = '🔊';
return;
}

/* old button reset */
if (
currentSpeakerButton &&
currentSpeakerButton !== button
) {
currentSpeakerButton.innerHTML =
'🔊';}
currentSpeakerButton = button;

/* show bar */
paperAudioBar.style.display =
'block';
paperShowBarBtn.style.display =
'none';
    
paperAudioBar.classList.remove(
'hidden-bar'
);
/* reset minimize */

paperAudioBar.classList.remove(
'minimized'
);

/* play */
paperAudio.src = src;  
paperAudio.playbackRate = currentSpeed;/* ✅ speed restore */    
paperAudio.play();
paperNowPlaying.innerHTML =
title;
button.innerHTML = '⏸';
paperPlayBtn.innerHTML = '⏸';
};

/* ==
PLAY / PAUSE
== */
paperPlayBtn.addEventListener(
'click',
() => {
if (paperAudio.paused) {
paperAudio.play();
paperPlayBtn.innerHTML = '⏸';
if (currentSpeakerButton) {
currentSpeakerButton.innerHTML =
'⏸';
}
} else {
paperAudio.pause();
paperPlayBtn.innerHTML = '▶';
if (currentSpeakerButton) {
currentSpeakerButton.innerHTML =
'🔊';
}}});

/* ==
ENDED
== */
paperAudio.addEventListener(
'ended',
() => {

/* 🔂 repeat current */
if (repeatOne) {
paperAudio.currentTime = 0;
paperAudio.play();
return;}

/* ⏭️ auto next */
if (autoNextEnabled) {
playNextAudio();
return;}

/* default close */
paperAudioBar.style.display =
'none';
paperShowBarBtn.style.display =
'none';
if (currentSpeakerButton) {
currentSpeakerButton.innerHTML =
'🔊';}});

/* ==
TIME UPDATE
== */
paperAudio.addEventListener(
'timeupdate',
() => {
if (!paperAudio.duration) return;
paperSeekbar.value =
(paperAudio.currentTime
/
paperAudio.duration
)
* 100;
updatePaperTime();
});

/* ==
SEEK
== */
paperSeekbar.addEventListener(
'input',
() => {
if (!paperAudio.duration) return;
paperAudio.currentTime =
(
paperSeekbar.value / 100
)
*
paperAudio.duration;
}
);


/* ==VOLUME SLIDER== */
paperVolumeSlider.addEventListener(
'input',
() => {
const value =
parseInt(
paperVolumeSlider.value
);
    
/*100 = normal 300 = 3x boost*/
const gain =
value / 100;
gainNode.gain.value =
gain;
paperVolumeDisplay.innerHTML =
value + '%';
});/*VOLUME SLIDER အဆုံး*/


/* ==SPEED== */
paperFasterBtn.addEventListener(
'click',
() => {
if (currentSpeed < 3) {
currentSpeed += 0.25;
currentSpeed =
parseFloat(
currentSpeed.toFixed(2)
);
paperAudio.playbackRate =
currentSpeed;
updateSpeedDisplay();
}});

/* ==REPEAT TOGGLE== */
paperRepeatBtn.addEventListener(
'click',
() => {
repeatOne = !repeatOne;
paperRepeatBtn.classList.toggle(
'paper-mode-active',
repeatOne
);

/* 🔂 ON => ⏭️ OFF */
if (repeatOne) {
autoNextEnabled = false;
paperAutonextBtn.classList.remove(
'paper-mode-active'
);}});/*REPEAT TOGGLEအဆုံး*/

/* ==AUTO NEXT TOGGLE== */
paperAutonextBtn.addEventListener(
'click',
() => {
autoNextEnabled =
!autoNextEnabled;
paperAutonextBtn.classList.toggle(
'paper-mode-active',
autoNextEnabled
);

/* ⏭️ ON => 🔂 OFF */
if (autoNextEnabled) {
repeatOne = false;
paperRepeatBtn.classList.remove(
'paper-mode-active'
);}});/*AUTO NEXT TOGGLEအဆုံး*/


/* ==
🎙 VOICE MODE
== */
paperVoiceBtn.addEventListener(
'click',
() => {
voiceModeEnabled =
!voiceModeEnabled;

/* button active */
paperVoiceBtn.classList.toggle(
'paper-mode-active',
voiceModeEnabled
);

/* EQ */
if (voiceModeEnabled) {
voiceEQ.gain.value = 8;
} else {
voiceEQ.gain.value = 0;
}});/* ==🎙 VOICE MODE အဆုံး== */

/* ==
🌙 NIGHT MODE
== */
paperNightBtn.addEventListener(
'click',
() => {
nightModeEnabled =
!nightModeEnabled;
/* button active */
paperNightBtn.classList.toggle(
'paper-mode-active',
nightModeEnabled
);
/* soft treble */
if (nightModeEnabled) {
nightEQ.gain.value = -10;
} else {
nightEQ.gain.value = 0;}
});/* ==🌙 NIGHT MODEအဆုံး== */

paperSlowerBtn.addEventListener(
'click',
() => {
if (currentSpeed > 0.25) {
currentSpeed -= 0.25;
currentSpeed =
parseFloat(
currentSpeed.toFixed(2)
);
paperAudio.playbackRate =
currentSpeed;
updateSpeedDisplay();
}});
function updateSpeedDisplay() {
paperSpeedDisplay.innerHTML =
currentSpeed + 'x';
}

/* ==
TIME FORMAT
== */
function formatPaperTime(
seconds
) {
const min =
Math.floor(seconds / 60);
const sec =
Math.floor(seconds % 60);
return `${min}:${
sec
.toString()
.padStart(2,'0')
}`;
}

function updatePaperTime() {
paperTimeDisplay.innerHTML =
`${formatPaperTime(
paperAudio.currentTime
)}
/
${formatPaperTime(
paperAudio.duration || 0
)}`;
}



/* ==
HIDE BAR
== */
paperHideBtn
.addEventListener(
'click',
() => {

/* bar hide */
paperAudioBar.classList.add(
'hidden-bar');

/* floating eye show */
paperShowBarBtn.style.display =
'flex';});

/* ==
MINIMIZE
== */
paperMinimizeBtn
.addEventListener(
'click',
() => {
paperAudioBar.classList.toggle(
'minimized'
);});

/* ==
SHOW HIDDEN BAR
== */
paperShowBarBtn
.addEventListener(
'click',
() => {

/* show bar again */
paperAudioBar.classList.remove(
'hidden-bar');

/* floating eye hide */
paperShowBarBtn.style.display =
'none';
});


/* ==
CLOSE
== */
paperCloseBtn
.addEventListener(
'click',
() => {
paperAudio.pause();
paperAudio.currentTime = 0;
paperAudioBar.style.display =
'none';
  paperShowBarBtn.style.display =
'none';  
paperAudioBar.classList.remove(
'minimized'
);
if (currentSpeakerButton) {
currentSpeakerButton.innerHTML =
'🔊';
}
}
);/*အဆုံး*/


/*ပြန်စ ကျော် ဆက်လုပ် ခလုပ်များ အတွက် အစ */
/* GET AUDIO BUTTONS */
function getAudioButtons() {
return Array.from(
document.querySelectorAll(
'[onclick*="togglePaperAudio"]'
)
);
}
/* ==
EXTRACT AUDIO DATA
== */
function extractAudioData(button) {
const onclickText =
button.getAttribute('onclick');
const match =
onclickText.match(
/togglePaperAudio\(this,\s*'([^']+)'\s*,\s*'([^']+)'\)/
);
if (!match) return null;
return {
src: match[1],
title: match[2]
};
}
/* ==
PLAY AUDIO BY INDEX
== */
function playAudioByIndex(index) {
const buttons =
getAudioButtons();
if (
index < 0 ||
index >= buttons.length
) {
return;
}
const button =
buttons[index];
const data =
extractAudioData(button);
if (!data) return;
window.togglePaperAudio(
button,
data.src,
data.title
);
}

/* NEXT AUDIO */
function playNextAudio() {
const buttons =
getAudioButtons();
if (!currentSpeakerButton ||buttons.length === 0
) {return;}
const currentIndex =
buttons.indexOf(currentSpeakerButton);
let nextIndex =
currentIndex + 1;

/* last audio => go first */
if (nextIndex >= buttons.length) {nextIndex = 0;}
playAudioByIndex(nextIndex);}
/*NEXT AUDIO အဆုံး*/

/* PREVIOUS AUDIO */
function playPreviousAudio() {

const buttons =
getAudioButtons();
if (
!currentSpeakerButton ||
buttons.length === 0) {return;}
const currentIndex =
buttons.indexOf(
currentSpeakerButton
);
let prevIndex =
currentIndex - 1; /*PREVIOUS AUDIO*/

/* first audio => go last */
if (prevIndex < 0) {
prevIndex =
buttons.length - 1;}
playAudioByIndex(prevIndex);}/* first audio => go last */

/* NEXT BUTTON */
paperNextBtn.addEventListener(
'click',
() => {
playNextAudio();
});/* NEXT BUTTON */

/* PREVIOUS BUTTON */
paperPrevBtn.addEventListener(
'click',
() => {
playPreviousAudio();
});/*PREVIOUS BUTTONအဆုံး*/

/* ==SLEEP TIMER START== */
paperSleepStartBtn.addEventListener(
    'click',
    () => {
        const value =
            parseInt(
                paperSleepInput.value
            );
        const unit =
            paperSleepUnit.value;

        /* validation */
        if (
            isNaN(value)
        ) {
            alert(
                'အချိန်ရိုက်ထည့်ပါ'
            );
            return;
        }
        let totalMinutes = value;
        if (unit === 'hour') {
            totalMinutes =
                value * 60;
        }/* validation */

        /* 1 minute → 8 hour */
        if (
            totalMinutes < 1 ||
            totalMinutes > 480
        ) {
            alert(
                '1 minute မှ 8 hour(480 မိနစ်) အတွင်းပဲ ရပါတယ်'
            );
            return;
        } /* 1 minute → 8 hour */

        /* old timer clear */
        clearTimeout(sleepTimer);
        clearInterval(sleepInterval);/* old timer clear */

        /* end time */
        sleepEndTime =
            Date.now()
            +
            (totalMinutes
                * 60
                * 1000
            );/* end time */

        /* main timer */
        sleepTimer =
            setTimeout(() => {
                paperAudio.pause();
                paperAudioBar.style.display =
                    'none';
                paperShowBarBtn.style.display =
                    'none';
                if (
                    currentSpeakerButton
                ) {
                    currentSpeakerButton.innerHTML =
                        '🔊';
                }
                paperSleepStatus.innerHTML =
                    '⏰ Sleep Finished';
            },
            totalMinutes
            * 60
            * 1000
        );/* main timer */

        /* live countdown */
        sleepInterval =
            setInterval(() => {
                const remain =
                    sleepEndTime
                    - Date.now();
                if (remain <= 0) {
                    clearInterval(
                        sleepInterval
                    );
                    return;
                }
                const totalSec =
                    Math.floor(
                        remain / 1000
                    );
                const h =
                    Math.floor(
                        totalSec / 3600
                    );
                const m =
                    Math.floor(
                        (
                            totalSec % 3600
                        ) / 60
                    );
                const s =
                    totalSec % 60;
                paperSleepStatus.innerHTML =
                    `😴 ${h}h ${m}m ${s}s`;
            }, 1000);
        paperSleepStatus.innerHTML =
            '😴 Timer Started';});/* live countdown */

/* cancel ခလုပ်အတွက်*/
paperSleepCancelBtn.addEventListener(
    'click',
    () => {
        clearTimeout(sleepTimer);
        clearInterval(sleepInterval);
        sleepTimer = null;
        sleepEndTime = null;
        paperSleepStatus.innerHTML =
            'No Timer';
});/* cancel ခလုပ်အတွက်*/
/*SLEEP TIMER START အဆုံး */

/* ==AUTO PLAY FROM LINK အစ==*/
window.addEventListener(
'load',
() => {
const params =
new URLSearchParams(
window.location.search
);
const shouldAutoplay =
params.get('autoplay');
const hash =
window.location.hash;
if (
shouldAutoplay === '1'
&&
hash
) {
setTimeout(() => {
const target =
document.querySelector(hash);
if (!target) return;
const button =
target.querySelector(
'.speaker-btn'
);
if (!button) return;
button.click();
}, 1200);
}});/* AUTO PLAY FROM LINK ဒီကုဒ်အစအဆုံးကို about.htmlနှင့် portfolio.html မှ အသံဖိုင်လင့်နှင့် နားထောင်ရန်သုံးထားသည်။ AUTO PLAY FROM LINK*/


/* ==
 DOWNLOAD CURRENT AUDIO
 ==*/
const paperDownloadBtn =
document.getElementById(
"paper-download-btn"
);

paperDownloadBtn.addEventListener(
"click",
() => {

    const audioSrc =
    paperAudio.src;

    if (!audioSrc) {
        alert(
        "အသံဖိုင် မရှိသေးပါ"
        );
        return;
    }

    /* temporary link */
    const a =
    document.createElement("a");

    a.href = audioSrc;

    /* ✅ ORIGINAL FILE NAME */
    const url =
    new URL(audioSrc);

    const rawName =
    url.pathname.split("/").pop();

    const fileName =
    decodeURIComponent(rawName);

    a.download =
    fileName;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

});/* == DOWNLOAD CURRENT AUDIO အဆုံး ==*/
