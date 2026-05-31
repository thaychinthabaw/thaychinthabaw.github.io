(() => {
'use strict';

/* =========================
   AUDIO ELEMENTS
========================= */
const paperAudio = document.getElementById('paper-audio');
const paperAudioBar = document.getElementById('paper-audio-bar');
const paperPlayBtn = document.getElementById('paper-play-btn');
const paperSeekbar = document.getElementById('paper-seekbar');
const paperVolumeSlider = document.getElementById('paper-volume-slider');
const paperVolumeDisplay = document.getElementById('paper-volume-display');
const paperNowPlaying = document.getElementById('paper-now-playing');
const paperTimeDisplay = document.getElementById('paper-time-display');

const paperCloseBtn = document.getElementById('paper-close-btn');
const paperMinimizeBtn = document.getElementById('paper-minimize-btn');
const paperHideBtn = document.getElementById('paper-hide-btn');
const paperShowBarBtn = document.getElementById('paper-show-bar-btn');

const paperFasterBtn = document.getElementById('paper-faster-btn');
const paperSlowerBtn = document.getElementById('paper-slower-btn');
const paperSpeedDisplay = document.getElementById('paper-speed-display');

const paperRepeatBtn = document.getElementById('paper-repeat-btn');
const paperAutonextBtn = document.getElementById('paper-autonext-btn');

const paperPrevBtn = document.getElementById('paper-prev-btn');
const paperNextBtn = document.getElementById('paper-next-btn');

const paperVoiceBtn = document.getElementById('paper-voice-btn');
const paperNightBtn = document.getElementById('paper-night-btn');

/* SLEEP TIMER */
const paperSleepInput = document.getElementById('paper-sleep-input');
const paperSleepUnit = document.getElementById('paper-sleep-unit');
const paperSleepStartBtn = document.getElementById('paper-sleep-start-btn');
const paperSleepCancelBtn = document.getElementById('paper-sleep-cancel-btn');
const paperSleepStatus = document.getElementById('paper-sleep-status');

/* DOWNLOAD */
const paperDownloadBtn = document.getElementById('paper-download-btn');

/* =========================
   STATE
========================= */
let currentSpeakerButton = null;
let currentSpeed = 1;

let repeatOne = false;
let autoNextEnabled = false;

let voiceModeEnabled = false;
let nightModeEnabled = false;

let sleepTimer = null;
let sleepEndTime = null;
let sleepInterval = null;

/* =========================
   AUDIO CONTEXT (ARCHIVE-COMPATIBLE BOOST)
========================= */
// ပြင်ပ Archive လင့်ခ်များ CORS မငြိစေရန်အတွက် Web Audio API ထဲသို့ အတင်းဖြတ်မမောင်းတော့ဘဲ HTML Audio Level ဖြင့် အသံမြှင့်တင်မှု ပြုလုပ်ပါမည်။
let baseVolumeMultiplier = 1; 

function applyVolume() {
    if (!paperVolumeSlider) return;
    const sliderValue = parseInt(paperVolumeSlider.value);
    
    // EQ Modes များအရ အသံပမာဏ ထိန်းညှိခြင်း
    let modeModifier = 1;
    if (voiceModeEnabled) modeModifier = 1.3; // စကားသံရှင်း စနစ်အတွက် အသံမြှင့်ပေးခြင်း
    if (nightModeEnabled) modeModifier = 0.7; // ညနားထောင်စနစ်အတွက် အသံလျှော့ပေးခြင်း

    // အမြင့်ဆုံး 300% အထိ အသံတိုး/ကျယ် ပြုလုပ်ပေးခြင်း
    paperAudio.volume = Math.min(1, (sliderValue / 100) * 0.33 * modeModifier);
    paperVolumeDisplay.innerHTML = sliderValue + '%';
}

/* =========================
   MAIN PLAY FUNCTION
========================= */
window.togglePaperAudio = function(button, src, title) {

    // လင့်ခ်ချင်း တူမတူကို ပုံစံမျိုးစုံဖြင့် စစ်ဆေးခြင်း (Archive Unicode / Encode ကာကွယ်ရန်)
    const isSameButton = currentSpeakerButton === button;
    const isSameAudio = paperAudio.src === src || decodeURI(paperAudio.src).includes(src) || encodeURI(paperAudio.src).includes(src);

    if (isSameButton && isSameAudio && !paperAudio.paused) {
        paperAudio.pause();
        paperAudioBar.style.display = 'none';
        paperShowBarBtn.style.display = 'none';
        button.innerHTML = '🔊';
        if (paperPlayBtn) paperPlayBtn.innerHTML = '▶';
        return;
    }

    if (currentSpeakerButton && currentSpeakerButton !== button) {
        currentSpeakerButton.innerHTML = '🔊';
    }

    currentSpeakerButton = button;

    paperAudioBar.style.display = 'block';
    paperShowBarBtn.style.display = 'none';

    paperAudioBar.classList.remove('hidden-bar');
    paperAudioBar.classList.remove('minimized');

    if (paperAudio.src !== src) {
        paperAudio.src = src;
    }
    paperAudio.playbackRate = currentSpeed;
    applyVolume();

    paperAudio.play()
        .then(() => {
            button.innerHTML = '⏸';
            if (paperPlayBtn) paperPlayBtn.innerHTML = '⏸';
        })
        .catch(err => {
            console.log("Archive.org file play error:", err);
        });

    paperNowPlaying.innerHTML = title;
};

/* =========================
   PLAY / PAUSE BUTTON
========================= */
paperPlayBtn?.addEventListener('click', () => {
    if (paperAudio.paused) {
        paperAudio.play();
        paperPlayBtn.innerHTML = '⏸';
        if (currentSpeakerButton) currentSpeakerButton.innerHTML = '⏸';
    } else {
        paperAudio.pause();
        paperPlayBtn.innerHTML = '▶';
        if (currentSpeakerButton) currentSpeakerButton.innerHTML = '🔊';
    }
});

/* =========================
   END EVENT
========================= */
paperAudio?.addEventListener('ended', () => {

    if (repeatOne) {
        paperAudio.currentTime = 0;
        paperAudio.play();
        return;
    }

    if (autoNextEnabled) {
        playNextAudio();
        return;
    }

    paperAudioBar.style.display = 'none';
    paperShowBarBtn.style.display = 'none';

    if (currentSpeakerButton) {
        currentSpeakerButton.innerHTML = '🔊';
    }
    if (paperPlayBtn) paperPlayBtn.innerHTML = '▶';
});

/* =========================
   SEEK / TIME
========================= */
paperAudio?.addEventListener('timeupdate', () => {
    if (!paperAudio.duration) return;

    paperSeekbar.value =
        (paperAudio.currentTime / paperAudio.duration) * 100;

    updatePaperTime();
});

paperSeekbar?.addEventListener('input', () => {
    if (!paperAudio.duration) return;

    paperAudio.currentTime =
        (paperSeekbar.value / 100) * paperAudio.duration;
});

/* =========================
   VOLUME
========================= */
paperVolumeSlider?.addEventListener('input', applyVolume);

/* =========================
   SPEED
========================= */
paperFasterBtn?.addEventListener('click', () => {
    if (currentSpeed < 3) {
        currentSpeed += 0.25;
        currentSpeed = parseFloat(currentSpeed.toFixed(2));
        paperAudio.playbackRate = currentSpeed;
        updateSpeedDisplay();
    }
});

paperSlowerBtn?.addEventListener('click', () => {
    if (currentSpeed > 0.25) {
        currentSpeed -= 0.25;
        currentSpeed = parseFloat(currentSpeed.toFixed(2));
        paperAudio.playbackRate = currentSpeed;
        updateSpeedDisplay();
    }
});

function updateSpeedDisplay() {
    if (paperSpeedDisplay)
        paperSpeedDisplay.innerHTML = currentSpeed + 'x';
}

/* =========================
   REPEAT / AUTO NEXT
========================= */
paperRepeatBtn?.addEventListener('click', () => {
    repeatOne = !repeatOne;
    paperRepeatBtn.classList.toggle('paper-mode-active', repeatOne);

    if (repeatOne) {
        autoNextEnabled = false;
        paperAutonextBtn?.classList.remove('paper-mode-active');
    }
});

paperAutonextBtn?.addEventListener('click', () => {
    autoNextEnabled = !autoNextEnabled;
    paperAutonextBtn.classList.toggle('paper-mode-active', autoNextEnabled);

    if (autoNextEnabled) {
        repeatOne = false;
        paperRepeatBtn?.classList.remove('paper-mode-active');
    }
});

/* =========================
   VOICE / NIGHT MODE
========================= */
paperVoiceBtn?.addEventListener('click', () => {
    voiceModeEnabled = !voiceModeEnabled;
    paperVoiceBtn.classList.toggle('paper-mode-active', voiceModeEnabled);
    if (voiceModeEnabled) {
        nightModeEnabled = false;
        paperNightBtn?.classList.remove('paper-mode-active');
    }
    applyVolume();
});

paperNightBtn?.addEventListener('click', () => {
    nightModeEnabled = !nightModeEnabled;
    paperNightBtn.classList.toggle('paper-mode-active', nightModeEnabled);
    if (nightModeEnabled) {
        voiceModeEnabled = false;
        paperVoiceBtn?.classList.remove('paper-mode-active');
    }
    applyVolume();
});

/* =========================
   TIME FORMAT
========================= */
function formatPaperTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function updatePaperTime() {
    if (!paperTimeDisplay) return;

    paperTimeDisplay.innerHTML =
        `${formatPaperTime(paperAudio.currentTime)} / ${formatPaperTime(paperAudio.duration || 0)}`;
}

/* =========================
   BAR CONTROLS
========================= */
paperHideBtn?.addEventListener('click', () => {
    paperAudioBar.classList.add('hidden-bar');
    paperShowBarBtn.style.display = 'flex';
});

paperMinimizeBtn?.addEventListener('click', () => {
    paperAudioBar.classList.toggle('minimized');
});

paperShowBarBtn?.addEventListener('click', () => {
    paperAudioBar.classList.remove('hidden-bar');
    paperShowBarBtn.style.display = 'none';
});

paperCloseBtn?.addEventListener('click', () => {
    paperAudio.pause();
    paperAudio.currentTime = 0;

    paperAudioBar.style.display = 'none';
    paperShowBarBtn.style.display = 'none';

    paperAudioBar.classList.remove('minimized');

    if (currentSpeakerButton) {
        currentSpeakerButton.innerHTML = '🔊';
    }
    if (paperPlayBtn) paperPlayBtn.innerHTML = '▶';
});

/* =========================
   AUDIO LIST NAVIGATION
========================= */
function getAudioButtons() {
    return Array.from(document.querySelectorAll('[onclick*="togglePaperAudio"]'));
}

function extractAudioData(button) {
    const match = button.getAttribute('onclick')
        .match(/togglePaperAudio\(this,\s*'([^']+)'\s*,\s*'([^']+)'\)/);

    if (!match) return null;

    return { src: match[1], title: match[2] };
}

function playAudioByIndex(index) {
    const buttons = getAudioButtons();
    if (index < 0 || index >= buttons.length) return;

    const btn = buttons[index];
    const data = extractAudioData(btn);
    if (!data) return;

    window.togglePaperAudio(btn, data.src, data.title);
}

function playNextAudio() {
    const buttons = getAudioButtons();
    if (!currentSpeakerButton) return;

    let i = buttons.indexOf(currentSpeakerButton);
    playAudioByIndex((i + 1) % buttons.length);
}

function playPreviousAudio() {
    const buttons = getAudioButtons();
    if (!currentSpeakerButton) return;

    let i = buttons.indexOf(currentSpeakerButton);
    playAudioByIndex((i - 1 + buttons.length) % buttons.length);
}

paperNextBtn?.addEventListener('click', playNextAudio);
paperPrevBtn?.addEventListener('click', playPreviousAudio);

/* =========================
   SLEEP TIMER
========================= */
paperSleepStartBtn?.addEventListener('click', () => {

    let value = parseInt(paperSleepInput.value);
    let unit = paperSleepUnit.value;

    if (isNaN(value)) return alert('အချိန်ရိုက်ထည့်ပါ');

    let minutes = unit === 'hour' ? value * 60 : value;

    if (minutes < 1 || minutes > 480)
        return alert('1 minute မှ 8 hour အတွင်းပဲရပါတယ်');

    clearTimeout(sleepTimer);
    clearInterval(sleepInterval);

    sleepEndTime = Date.now() + minutes * 60000;

    sleepTimer = setTimeout(() => {
        paperAudio.pause();
        paperAudioBar.style.display = 'none';
        paperShowBarBtn.style.display = 'none';
        if (currentSpeakerButton) currentSpeakerButton.innerHTML = '🔊';
        paperSleepStatus.innerHTML = '⏰ Sleep Finished';
        if (paperPlayBtn) paperPlayBtn.innerHTML = '▶';
    }, minutes * 60000);

    sleepInterval = setInterval(() => {
        const remain = sleepEndTime - Date.now();
        if (remain <= 0) return clearInterval(sleepInterval);

        const sec = Math.floor(remain / 1000);
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;

        paperSleepStatus.innerHTML = `😴 ${h}h ${m}m ${s}s`;

    }, 1000);
});

paperSleepCancelBtn?.addEventListener('click', () => {
    clearTimeout(sleepTimer);
    clearInterval(sleepInterval);
    paperSleepStatus.innerHTML = 'No Timer';
});

/* =========================
   AUTO PLAY FROM LINK
========================= */
window.addEventListener('load', () => {
    const params = new URLSearchParams(location.search);
    const hash = location.hash;

    if (params.get('autoplay') === '1' && hash) {
        setTimeout(() => {
            const target = document.querySelector(hash);
            const btn = target?.querySelector('.speaker-btn');
            if (btn) btn.click();
        }, 1200);
    }
});

/* =========================
   DOWNLOAD AUDIO
========================= */
paperDownloadBtn?.addEventListener('click', () => {
    if (!paperAudio.src) return alert('အသံဖိုင် မရှိသေးပါ');

    const a = document.createElement('a');
    a.href = paperAudio.src;

    const file = new URL(paperAudio.src).pathname.split('/').pop();
    a.download = decodeURIComponent(file);

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

})();
