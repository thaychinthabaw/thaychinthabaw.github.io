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
