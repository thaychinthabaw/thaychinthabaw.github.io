paper-audio.js

(() => {
'use strict';

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

/* =========================
STATE
========================= */

let currentSpeakerButton = null;

let currentSpeed = 1;

let repeatOne = false;

let autoNextEnabled = false;

/* =========================
TOGGLE AUDIO
========================= */

window.togglePaperAudio =
function(
button,
src,
title
) {

const isSameButton =
currentSpeakerButton === button;

const isSameAudio =
decodeURI(
paperAudio.src
).includes(src);

if (
isSameButton &&
isSameAudio &&
!paperAudio.paused
) {

paperAudio.pause();

paperAudioBar.style.display =
'none';

button.innerHTML = '🔊';

return;
}

if (
currentSpeakerButton &&
currentSpeakerButton !== button
) {

currentSpeakerButton.innerHTML =
'🔊';
}

currentSpeakerButton = button;

paperAudioBar.style.display =
'block';

paperAudio.src = src;

paperAudio.playbackRate =
currentSpeed;

paperAudio.play();

button.innerHTML = '⏸';

paperPlayBtn.innerHTML = '⏸';
};

/* =========================
PLAY / PAUSE
========================= */

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
}
}
});

/* =========================
ENDED
========================= */

paperAudio.addEventListener(
'ended',
() => {

if (repeatOne) {

paperAudio.currentTime = 0;

paperAudio.play();

return;
}

if (currentSpeakerButton) {

currentSpeakerButton.innerHTML =
'🔊';
}

paperAudioBar.style.display =
'none';
});

/* =========================
DOWNLOAD AUDIO
========================= */

const paperDownloadBtn =
document.getElementById(
"paper-download-btn"
);

if (paperDownloadBtn) {

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

const a =
document.createElement("a");

a.href = audioSrc;

const url =
new URL(audioSrc);

const rawName =
url.pathname
.split("/")
.pop();

const fileName =
decodeURIComponent(rawName);

a.download =
fileName;

document.body.appendChild(a);

a.click();

document.body.removeChild(a);
});
}

})();
