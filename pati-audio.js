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
   AUDIO CONTEXT (BOOST + FILTERS)
========================= */
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const source = audioContext.createMediaElementSource(paperAudio);
const gainNode = audioContext.createGain();

const voiceEQ = audioContext.createBiquadFilter();
voiceEQ.type = 'peaking';
voiceEQ.frequency.value = 2500;
voiceEQ.Q.value = 1;
voiceEQ.gain.value = 0;

const nightEQ = audioContext.createBiquadFilter();
nightEQ.type = 'highshelf';
nightEQ.frequency.value = 3000;
nightEQ.gain.value = 0;

source.connect(gainNode);
gainNode.connect(voiceEQ);
voiceEQ.connect(nightEQ);
nightEQ.connect(audioContext.destination);

gainNode.gain.value = 1;

/* =========================
   MAIN PLAY FUNCTION (FIXED BUG)
========================= */
window.togglePaperAudio = function(button, src, title) {

    // လက်ရှိ ဖွင့်နေဆဲ ခလုတ်ကိုပဲ ထပ်နှိပ်တာလားဆိုတာ တိုက်ရိုက်စစ်ဆေးခြင်း
    const isSameButton = currentSpeakerButton === button;

    // အကယ်၍ ဖွင့်နေဆဲခလုတ်ကို ပြန်နှိပ်ပြီး အသံကလည်း လာနေဆဲဖြစ်ပါက အသံပိတ်မည်
    if (isSameButton && !paperAudio.paused) {
        paperAudio.pause();
        paperAudioBar.style.display = 'none';
        paperShowBarBtn.style.display = 'none';
        button.innerHTML = '🔊';
        if (paperPlayBtn) paperPlayBtn.innerHTML = '▶';
        return;
    }

    // တခြားခလုတ်အသစ်ကို နှိပ်လိုက်ရင် လက်ရှိခလုတ်ဟောင်းကို 🔊 ပြန်ပြောင်းမည်
    if (currentSpeakerButton && currentSpeakerButton !== button) {
        currentSpeakerButton.innerHTML = '🔊';
    }

    currentSpeakerButton = button;

    paperAudioBar.style.display = 'block';
    paperShowBarBtn.style.display = 'none';

    paperAudioBar.classList.remove('hidden-bar');
    paperAudioBar.classList.remove('minimized');

    // တကယ်လို့ ခလုတ်အသစ်ဖြစ်မှသာ လင့်ခ်အသစ်ပြောင်းထည့်ပြီး အစကဖွင့်ပါမည်
    if (!isSameButton) {
        paperAudio.src = src;
    }
    
    paperAudio.playbackRate = currentSpeed;

    // AudioContext ကို နှိုးခြင်း
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    paperAudio.play()
        .catch(err => console.log("Archive Playback trigger:", err));

    paperNowPlaying.innerHTML = title;

    button.innerHTML = '⏸';
    if (paperPlayBtn) paperPlayBtn.innerHTML = '⏸';
};

/* =========================
   PLAY / PAUSE BUTTON
========================= */
paperPlayBtn?.addEventListener('click', () => {
    if (paperAudio.paused) {
        if (audioContext.state === 'suspended') audioContext.resume();
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
paperVolumeSlider?.addEventListener('input', () => {
    const value = parseInt(paperVolumeSlider.value);
    gainNode.gain.value = value / 100;
    paperVolumeDisplay.innerHTML = value + '%';
});

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
    voiceEQ.gain.value = voiceModeEnabled ? 8 : 0;
});

paperNightBtn?.addEventListener('click', () => {
    nightModeEnabled = !nightModeEnabled;
    paperNightBtn.classList.toggle('paper-mode-active', nightModeEnabled);
    nightEQ.gain.value = nightModeEnabled ? -10 : 0;
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

/* ========================================================
   DOWNLOAD AUDIO
======================================================== */
paperDownloadBtn?.addEventListener('click', async () => {
    if (!paperAudio.src) return alert('အသံဖိုင် မရှိသေးပါ');

    const originalBtnText = paperDownloadBtn.innerHTML;
    try {
        paperDownloadBtn.innerHTML = '⏳';
        
        const response = await fetch(paperAudio.src);
        if (!response.ok) throw new Error("Network issue");
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;

        const file = new URL(paperAudio.src).pathname.split('/').pop();
        a.download = decodeURIComponent(file) || "audio-archive.mp3";

        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error("Direct download failed, fallback to window open:", error);
        const a = document.createElement('a');
        a.href = paperAudio.src;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } finally {
        paperDownloadBtn.innerHTML = originalBtnText;
    }
});

})();
