/* =========================
   PAPER AUDIO SYSTEM
========================= */
const paperAudio = document.getElementById('paper-audio');
const paperAudioBar = document.getElementById('paper-audio-bar');

/* =========================
   AUDIO STATE
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
   AUDIO ENGINE
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
   TOGGLE AUDIO
========================= */
window.togglePaperAudio = function(button, src, title) {
    const isSameButton = currentSpeakerButton === button;
    const isSameAudio = decodeURI(paperAudio.src).includes(src);

    if (isSameButton && isSameAudio && !paperAudio.paused) {
        paperAudio.pause();
        paperAudioBar.style.display = 'none';
        button.innerHTML = '🔊';
        return;
    }

    if (currentSpeakerButton && currentSpeakerButton !== button) {
        currentSpeakerButton.innerHTML = '🔊';
    }

    currentSpeakerButton = button;
    paperAudioBar.style.display = 'block';
    paperAudio.src = src;
    paperAudio.playbackRate = currentSpeed;
    paperAudio.play();
    button.innerHTML = '⏸';
};

/* =========================
   PLAY / PAUSE
========================= */
const paperPlayBtn = document.getElementById('paper-play-btn');
paperPlayBtn.addEventListener('click', () => {
    if (paperAudio.paused) {
        paperAudio.play();
        paperPlayBtn.innerHTML = '⏸';
    } else {
        paperAudio.pause();
        paperPlayBtn.innerHTML = '▶';
    }
});

/* =========================
   SPEED
========================= */
const paperFasterBtn = document.getElementById('paper-faster-btn');
const paperSlowerBtn = document.getElementById('paper-slower-btn');
const paperSpeedDisplay = document.getElementById('paper-speed-display');

function updateSpeedDisplay() {
    paperSpeedDisplay.innerHTML = currentSpeed + 'x';
}

paperFasterBtn.addEventListener('click', () => {
    if (currentSpeed < 3) {
        currentSpeed += 0.25;
        currentSpeed = parseFloat(currentSpeed.toFixed(2));
        paperAudio.playbackRate = currentSpeed;
        updateSpeedDisplay();
    }
});

paperSlowerBtn.addEventListener('click', () => {
    if (currentSpeed > 0.25) {
        currentSpeed -= 0.25;
        currentSpeed = parseFloat(currentSpeed.toFixed(2));
        paperAudio.playbackRate = currentSpeed;
        updateSpeedDisplay();
    }
});

/* =========================
   SEEKBAR
========================= */
const paperSeekbar = document.getElementById('paper-seekbar');
paperAudio.addEventListener('timeupdate', () => {
    if (!paperAudio.duration) return;
    paperSeekbar.value = (paperAudio.currentTime / paperAudio.duration) * 100;
});

paperSeekbar.addEventListener('input', () => {
    if (!paperAudio.duration) return;
    paperAudio.currentTime = (paperSeekbar.value / 100) * paperAudio.duration;
});

/* =========================
   VOLUME
========================= */
const paperVolumeSlider = document.getElementById('paper-volume-slider');
paperVolumeSlider.addEventListener('input', () => {
    const value = parseInt(paperVolumeSlider.value);
    gainNode.gain.value = value / 100;
});

/* =========================
   REPEAT
========================= */
const paperRepeatBtn = document.getElementById('paper-repeat-btn');
paperRepeatBtn.addEventListener('click', () => {
    repeatOne = !repeatOne;
    paperRepeatBtn.classList.toggle('paper-mode-active', repeatOne);
    if (repeatOne) {
        autoNextEnabled = false;
    }
});

/* =========================
   AUTO NEXT
========================= */
const paperAutonextBtn = document.getElementById('paper-autonext-btn');
paperAutonextBtn.addEventListener('click', () => {
    autoNextEnabled = !autoNextEnabled;
    paperAutonextBtn.classList.toggle('paper-mode-active', autoNextEnabled);
    if (autoNextEnabled) {
        repeatOne = false;
    }
});

/* =========================
   VOICE MODE
========================= */
const paperVoiceBtn = document.getElementById('paper-voice-btn');
paperVoiceBtn.addEventListener('click', () => {
    voiceModeEnabled = !voiceModeEnabled;
    paperVoiceBtn.classList.toggle('paper-mode-active', voiceModeEnabled);
    voiceEQ.gain.value = voiceModeEnabled ? 8 : 0;
});

/* =========================
   NIGHT MODE
========================= */
const paperNightBtn = document.getElementById('paper-night-btn');
paperNightBtn.addEventListener('click', () => {
    nightModeEnabled = !nightModeEnabled;
    paperNightBtn.classList.toggle('paper-mode-active', nightModeEnabled);
    nightEQ.gain.value = nightModeEnabled ? -10 : 0;
});

/* =========================
   DOWNLOAD AUDIO
========================= */
const paperDownloadBtn = document.getElementById('paper-download-btn');
paperDownloadBtn.addEventListener('click', () => {
    const audioSrc = paperAudio.src;
    if (!audioSrc) {
        alert('အသံဖိုင် မရှိသေးပါ');
        return;
    }
    const a = document.createElement('a');
    a.href = audioSrc;
    const url = new URL(audioSrc);
    const rawName = url.pathname.split('/').pop();
    const fileName = decodeURIComponent(rawName);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});
