/* =========================
AUDIO SYSTEM
========================= */

let currentSpeakerButton = null;
let currentSpeed = 1;

let repeatOne = false;
let autoNextEnabled = false;

let sleepTimer = null;
let sleepInterval = null;
let sleepEndTime = null;

/* AUDIO ELEMENTS */
const paperAudio = document.getElementById('paper-audio');
const paperAudioBar = document.getElementById('paper-audio-bar');
const paperPlayBtn = document.getElementById('paper-play-btn');
const paperSeekbar = document.getElementById('paper-seekbar');
const paperVolumeSlider = document.getElementById('paper-volume-slider');
const paperVolumeDisplay = document.getElementById('paper-volume-display');
const paperNowPlaying = document.getElementById('paper-now-playing');
const paperTimeDisplay = document.getElementById('paper-time-display');
const paperShowBarBtn = document.getElementById('paper-show-bar-btn');
const paperFasterBtn = document.getElementById('paper-faster-btn');
const paperSlowerBtn = document.getElementById('paper-slower-btn');
const paperSpeedDisplay = document.getElementById('paper-speed-display');
const paperRepeatBtn = document.getElementById('paper-repeat-btn');
const paperAutonextBtn = document.getElementById('paper-autonext-btn');
const paperPrevBtn = document.getElementById('paper-prev-btn');
const paperNextBtn = document.getElementById('paper-next-btn');

const paperSleepInput = document.getElementById('paper-sleep-input');
const paperSleepUnit = document.getElementById('paper-sleep-unit');
const paperSleepStartBtn = document.getElementById('paper-sleep-start-btn');
const paperSleepCancelBtn = document.getElementById('paper-sleep-cancel-btn');
const paperSleepStatus = document.getElementById('paper-sleep-status');

/* AUDIO CONTEXT */
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const source = audioContext.createMediaElementSource(paperAudio);
const gainNode = audioContext.createGain();
const voiceEQ = audioContext.createBiquadFilter();
const nightEQ = audioContext.createBiquadFilter();

voiceEQ.type = 'peaking';
voiceEQ.frequency.value = 2500;
voiceEQ.gain.value = 0;

nightEQ.type = 'highshelf';
nightEQ.frequency.value = 3000;
nightEQ.gain.value = 0;

source.connect(gainNode);
gainNode.connect(voiceEQ);
voiceEQ.connect(nightEQ);
nightEQ.connect(audioContext.destination);

gainNode.gain.value = 1;

/* TOGGLE AUDIO */
window.togglePaperAudio = function(button, src, title) {

const same = currentSpeakerButton === button;

if (same && !paperAudio.paused) {
paperAudio.pause();
paperAudioBar.style.display = 'none';
button.innerHTML = '🔊';
return;
}

if (currentSpeakerButton) currentSpeakerButton.innerHTML = '🔊';

currentSpeakerButton = button;

paperAudioBar.style.display = 'block';
paperAudio.src = src;
paperAudio.playbackRate = currentSpeed;
paperAudio.play();

paperNowPlaying.innerHTML = title;
button.innerHTML = '⏸';
};

/* PLAY PAUSE */
paperPlayBtn.onclick = () => {
if (paperAudio.paused) {
paperAudio.play();
} else {
paperAudio.pause();
}
};

/* SEEK */
paperSeekbar.oninput = () => {
paperAudio.currentTime =
(paperSeekbar.value / 100) * paperAudio.duration;
};

/* SPEED */
function updateSpeed() {
paperSpeedDisplay.innerHTML = currentSpeed + 'x';
}

paperFasterBtn.onclick = () => {
if (currentSpeed < 3) {
currentSpeed += 0.25;
paperAudio.playbackRate = currentSpeed;
updateSpeed();
}
};

paperSlowerBtn.onclick = () => {
if (currentSpeed > 0.25) {
currentSpeed -= 0.25;
paperAudio.playbackRate = currentSpeed;
updateSpeed();
}
};

/* REPEAT / AUTO NEXT */
paperRepeatBtn.onclick = () => {
repeatOne = !repeatOne;
paperRepeatBtn.classList.toggle('paper-mode-active', repeatOne);
if (repeatOne) {
autoNextEnabled = false;
paperAutonextBtn.classList.remove('paper-mode-active');
}
};

paperAutonextBtn.onclick = () => {
autoNextEnabled = !autoNextEnabled;
paperAutonextBtn.classList.toggle('paper-mode-active', autoNextEnabled);
if (autoNextEnabled) {
repeatOne = false;
paperRepeatBtn.classList.remove('paper-mode-active');
}
};

/* TIME */
paperAudio.ontimeupdate = () => {
if (!paperAudio.duration) return;
paperSeekbar.value =
(paperAudio.currentTime / paperAudio.duration) * 100;
paperTimeDisplay.innerHTML =
`${Math.floor(paperAudio.currentTime)} / ${Math.floor(paperAudio.duration)}`;
};

/* NEXT / PREV (hooks only) */
window.playNextAudio = () => {};
window.playPreviousAudio = () => {};

/* SLEEP TIMER */
paperSleepStartBtn.onclick = () => {

let v = parseInt(paperSleepInput.value);
let unit = paperSleepUnit.value;

if (isNaN(v) || v < 1) return alert('Invalid');

let min = unit === 'hour' ? v * 60 : v;

if (min > 480) return alert('Max 8 hours');

clearTimeout(sleepTimer);

sleepTimer = setTimeout(() => {
paperAudio.pause();
paperAudioBar.style.display = 'none';
paperSleepStatus.innerHTML = 'Sleep End';
}, min * 60000);

paperSleepStatus.innerHTML = 'Timer Started';
};

paperSleepCancelBtn.onclick = () => {
clearTimeout(sleepTimer);
paperSleepStatus.innerHTML = 'No Timer';
};
