/* =========================
audio.js
========================= */

(() => {

'use strict';

/* =========================
ELEMENTS
========================= */

const audio =
document.getElementById('audio-player');

const playButtons =
document.querySelectorAll('.play-btn');

const playPauseBtn =
document.getElementById('play-pause-btn');

const speedBtn =
document.getElementById('speed-btn');

const seekbar =
document.getElementById('seekbar');

const nowPlaying =
document.getElementById('now-playing');

const timeDisplay =
document.getElementById('time-display');

/* =========================
STATE
========================= */

let sleepTimer = null;

let playbackRates =
[1, 1.5, 2];

let speedIndex = 0;

/* =========================
PLAY AUDIO
========================= */

playButtons.forEach(btn => {

btn.addEventListener('click', () => {

const src =
btn.dataset.audio;

const title =
btn.dataset.title;

audio.src = src;

audio.play();

nowPlaying.textContent =
title;

localStorage.setItem(
'lastAudio',
src
);

localStorage.setItem(
'lastAudioTitle',
title
);

});

});

/* =========================
PLAY / PAUSE
========================= */

playPauseBtn.addEventListener(
'click',
() => {

if (audio.paused) {

audio.play();

} else {

audio.pause();

}

}
);

audio.addEventListener(
'play',
() => {

playPauseBtn.textContent = '⏸';

}
);

audio.addEventListener(
'pause',
() => {

playPauseBtn.textContent = '▶';

}
);

/* =========================
TIME UPDATE
========================= */

audio.addEventListener(
'timeupdate',
() => {

if (!audio.duration) return;

seekbar.value =
(audio.currentTime
/
audio.duration)
* 100;

localStorage.setItem(
'audioTime',
audio.currentTime
);

updateTime();

}
);

/* =========================
SEEK
========================= */

seekbar.addEventListener(
'input',
() => {

if (!audio.duration) return;

audio.currentTime =
(seekbar.value / 100)
* audio.duration;

}
);

/* =========================
RESTORE AUDIO
========================= */

window.addEventListener(
'DOMContentLoaded',
() => {

const lastAudio =
localStorage.getItem(
'lastAudio'
);

const lastTitle =
localStorage.getItem(
'lastAudioTitle'
);

const lastTime =
localStorage.getItem(
'audioTime'
);

if (lastAudio) {

audio.src = lastAudio;

nowPlaying.textContent =
lastTitle || 'Audio';

audio.addEventListener(
'loadedmetadata',
() => {

audio.currentTime =
parseFloat(lastTime || 0);

}
);

}

}
);

/* =========================
PLAYBACK SPEED
========================= */

speedBtn.addEventListener(
'click',
() => {

speedIndex++;

if (
speedIndex >= playbackRates.length
) {

speedIndex = 0;

}

const rate =
playbackRates[speedIndex];

audio.playbackRate = rate;

speedBtn.textContent =
rate + 'x';

}
);

/* =========================
TIME FORMAT
========================= */

function formatTime(seconds) {

const min =
Math.floor(seconds / 60);

const sec =
Math.floor(seconds % 60);

return `${min}:${
sec.toString().padStart(2,'0')
}`;

}

function updateTime() {

timeDisplay.textContent =

`${formatTime(audio.currentTime)}
/
${formatTime(audio.duration || 0)}`;

}

/* =========================
SLEEP TIMER
========================= */

function setSleepTimer(minutes) {

clearTimeout(sleepTimer);

sleepTimer = setTimeout(() => {

audio.pause();

alert(
`${minutes} မိနစ်ပြည့်ပါပြီ`
);

}, minutes * 60 * 1000);

alert(
`${minutes} မိနစ် Sleep Timer စတင်ပါပြီ`
);

}

function cancelSleepTimer() {

clearTimeout(sleepTimer);

alert('Sleep Timer ပိတ်လိုက်ပါပြီ');

}

/* =========================
SETTING
========================= */

function toggleSetting() {

const overlay =
document.getElementById(
'setting-overlay'
);

overlay.style.display =

overlay.style.display === 'block'
? 'none'
: 'block';

}

/* =========================
EXPORT
========================= */

window.toggleSetting =
toggleSetting;

window.setSleepTimer =
setSleepTimer;

window.cancelSleepTimer =
cancelSleepTimer;

})();
