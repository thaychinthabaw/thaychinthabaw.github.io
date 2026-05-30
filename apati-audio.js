(() => {
'use strict';

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

const paperSleepInput = document.getElementById('paper-sleep-input');
const paperSleepUnit = document.getElementById('paper-sleep-unit');
const paperSleepStartBtn = document.getElementById('paper-sleep-start-btn');
const paperSleepCancelBtn = document.getElementById('paper-sleep-cancel-btn');
const paperSleepStatus = document.getElementById('paper-sleep-status');
const paperDownloadBtn = document.getElementById('paper-download-btn');

let currentSpeakerButton = null;
let currentSpeed = 1;
let repeatOne = false;
let autoNextEnabled = false;
let voiceModeEnabled = false;
let nightModeEnabled = false;
let sleepTimer = null;
let sleepEndTime = null;
let sleepInterval = null;

// Audio Node Architecture Setup
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const source = audioContext.createMediaElementSource(paperAudio);
const gainNode = audioContext.createGain();

const voiceEQ = audioContext.createBiquadFilter();
voiceEQ.type = 'peaking'; voiceEQ.frequency.value = 2500; voiceEQ.Q.value = 1; voiceEQ.gain.value = 0;

const nightEQ = audioContext.createBiquadFilter();
nightEQ.type = 'highshelf'; nightEQ.frequency.value = 3000; nightEQ.gain.value = 0;

source.connect(gainNode);
gainNode.connect(voiceEQ);
voiceEQ.connect(nightEQ);
nightEQ.connect(audioContext.destination);

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
    paperShowBarBtn.style.display = 'none';
    paperAudioBar.classList.remove('hidden-bar', 'minimized');

    paperAudio.src = src;
    paperAudio.playbackRate = currentSpeed;
    paperAudio.play();

    paperNowPlaying.innerHTML = title;
    button.innerHTML = '⏸';
    if(paperPlayBtn) paperPlayBtn.innerHTML = '⏸';
};

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

paperAudio?.addEventListener('ended', () => {
    if (repeatOne) {
        paperAudio.currentTime = 0; paperAudio.play(); return;
    }
    if (autoNextEnabled) {
        playNextAudio(); return;
    }
    paperAudioBar.style.display = 'none';
    if (currentSpeakerButton) currentSpeakerButton.innerHTML = '🔊';
});

paperAudio?.addEventListener('timeupdate', () => {
    if (!paperAudio.duration) return;
    paperSeekbar.value = (paperAudio.currentTime / paperAudio.duration) * 100;
    if (paperTimeDisplay) {
        paperTimeDisplay.innerHTML = `${formatPaperTime(paperAudio.currentTime)} / ${formatPaperTime(paperAudio.duration || 0)}`;
    }
});

paperSeekbar?.addEventListener('input', () => {
    if (!paperAudio.duration) return;
    paperAudio.currentTime = (paperSeekbar.value / 100) * paperAudio.duration;
});

paperVolumeSlider?.addEventListener('input', () => {
    const value = parseInt(paperVolumeSlider.value);
    gainNode.gain.value = value / 100;
    if (paperVolumeDisplay) paperVolumeDisplay.innerHTML = value + '%';
});

paperFasterBtn?.addEventListener('click', () => {
    if (currentSpeed < 3) { currentSpeed += 0.25; paperAudio.playbackRate = currentSpeed; updateSpeedDisplay(); }
});
paperSlowerBtn?.addEventListener('click', () => {
    if (currentSpeed > 0.25) { currentSpeed -= 0.25; paperAudio.playbackRate = currentSpeed; updateSpeedDisplay(); }
});

function updateSpeedDisplay() {
    if (paperSpeedDisplay) paperSpeedDisplay.innerHTML = currentSpeed + 'x';
}

paperRepeatBtn?.addEventListener('click', () => {
    repeatOne = !repeatOne;
    paperRepeatBtn.classList.toggle('paper-mode-active', repeatOne);
    if (repeatOne) { autoNextEnabled = false; paperAutonextBtn?.classList.remove('paper-mode-active'); }
});

paperAutonextBtn?.addEventListener('click', () => {
    autoNextEnabled = !autoNextEnabled;
    paperAutonextBtn.classList.toggle('paper-mode-active', autoNextEnabled);
    if (autoNextEnabled) { repeatOne = false; paperRepeatBtn?.classList.remove('paper-mode-active'); }
});

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

function formatPaperTime(sec) {
    const m = Math.floor(sec / 60); const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

paperHideBtn?.addEventListener('click', () => { paperAudioBar.classList.add('hidden-bar'); paperShowBarBtn.style.display = 'flex'; });
paperMinimizeBtn?.addEventListener('click', () => paperAudioBar.classList.toggle('minimized'));
paperShowBarBtn?.addEventListener('click', () => { paperAudioBar.classList.remove('hidden-bar'); paperShowBarBtn.style.display = 'none'; });

paperCloseBtn?.addEventListener('click', () => {
    paperAudio.pause(); paperAudio.currentTime = 0;
    paperAudioBar.style.display = 'none'; paperShowBarBtn.style.display = 'none';
    if (currentSpeakerButton) currentSpeakerButton.innerHTML = '🔊';
});

function playNextAudio() {
    const buttons = Array.from(document.querySelectorAll('.speaker-btn'));
    if (!currentSpeakerButton || buttons.length === 0) return;
    let i = buttons.indexOf(currentSpeakerButton);
    let nextBtn = buttons[(i + 1) % buttons.length];
    if(nextBtn) nextBtn.click();
}

function playPreviousAudio() {
    const buttons = Array.from(document.querySelectorAll('.speaker-btn'));
    if (!currentSpeakerButton || buttons.length === 0) return;
    let i = buttons.indexOf(currentSpeakerButton);
    let prevBtn = buttons[(i - 1 + buttons.length) % buttons.length];
    if(prevBtn) prevBtn.click();
}

paperNextBtn?.addEventListener('click', playNextAudio);
paperPrevBtn?.addEventListener('click', playPreviousAudio);

// Sleep Timer Core Logic
paperSleepStartBtn?.addEventListener('click', () => {
    let value = parseInt(paperSleepInput.value);
    if (isNaN(value)) return alert('အချိန်ရိုက်ထည့်ပါ');
    let minutes = paperSleepUnit.value === 'hour' ? value * 60 : value;

    clearTimeout(sleepTimer); clearInterval(sleepInterval);
    sleepEndTime = Date.now() + minutes * 60000;

    sleepTimer = setTimeout(() => {
        paperAudio.pause(); paperAudioBar.style.display = 'none';
        if (currentSpeakerButton) currentSpeakerButton.innerHTML = '🔊';
        paperSleepStatus.innerHTML = '⏰ Sleep Finished';
    }, minutes * 60000);

    sleepInterval = setInterval(() => {
        const remain = sleepEndTime - Date.now();
        if (remain <= 0) return clearInterval(sleepInterval);
        const sec = Math.floor(remain / 1000);
        paperSleepStatus.innerHTML = `😴 ${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m ${sec % 60}s`;
    }, 1000);
});

paperSleepCancelBtn?.addEventListener('click', () => {
    clearTimeout(sleepTimer); clearInterval(sleepInterval); paperSleepStatus.innerHTML = 'No Timer';
});

paperDownloadBtn?.addEventListener('click', () => {
    if (!paperAudio.src) return alert('အသံဖိုင် မရှိသေးပါ');
    const a = document.createElement('a'); a.href = paperAudio.src;
    const file = new URL(paperAudio.src).pathname.split('/').pop();
    a.download = decodeURIComponent(file);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
});
})();
