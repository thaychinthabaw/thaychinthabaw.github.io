(() => {
'use strict';

/* =========================
   AUDIO ENGINE
========================= */

const AUDIO = {

    /* =========================
       STATE
    ========================= */
    state: {
        currentSpeed: 1,
        repeatOne: false,
        autoNext: false,
        voiceMode: false,
        nightMode: false,
        currentButton: null,
        sleepTimer: null,
        sleepInterval: null,
        sleepEndTime: null
    },

    /* =========================
       DOM
    ========================= */
    dom: {},

    audio: null,
    audioContext: null,
    source: null,
    gainNode: null,
    voiceEQ: null,
    nightEQ: null,

    /* =========================
       INIT
    ========================= */
    init() {

        this.cacheDOM();
        this.setupAudioGraph();
        this.bindEvents();
        this.bindGlobalButtons();
        this.handleAutoPlay();

    },

    /* =========================
       CACHE DOM
    ========================= */
    cacheDOM() {

        const $ = (id) => document.getElementById(id);

        this.dom = {

            audio: $('paper-audio'),
            bar: $('paper-audio-bar'),
            playBtn: $('paper-play-btn'),
            seekbar: $('paper-seekbar'),
            volume: $('paper-volume-slider'),
            volumeDisplay: $('paper-volume-display'),
            nowPlaying: $('paper-now-playing'),
            time: $('paper-time-display'),

            close: $('paper-close-btn'),
            hide: $('paper-hide-btn'),
            show: $('paper-show-bar-btn'),
            minimize: $('paper-minimize-btn'),

            faster: $('paper-faster-btn'),
            slower: $('paper-slower-btn'),
            speedDisplay: $('paper-speed-display'),

            repeat: $('paper-repeat-btn'),
            autoNext: $('paper-autonext-btn'),

            voice: $('paper-voice-btn'),
            night: $('paper-night-btn'),

            prev: $('paper-prev-btn'),
            next: $('paper-next-btn'),

            sleepInput: $('paper-sleep-input'),
            sleepUnit: $('paper-sleep-unit'),
            sleepStart: $('paper-sleep-start-btn'),
            sleepCancel: $('paper-sleep-cancel-btn'),
            sleepStatus: $('paper-sleep-status'),

            download: $('paper-download-btn')
        };

        this.audio = this.dom.audio;
    },

    /* =========================
       AUDIO GRAPH
    ========================= */
    setupAudioGraph() {

        this.audioContext =
            new (window.AudioContext || window.webkitAudioContext)();

        this.source =
            this.audioContext.createMediaElementSource(this.audio);

        this.gainNode =
            this.audioContext.createGain();

        this.voiceEQ =
            this.audioContext.createBiquadFilter();
        this.voiceEQ.type = 'peaking';
        this.voiceEQ.frequency.value = 2500;
        this.voiceEQ.Q.value = 1;
        this.voiceEQ.gain.value = 0;

        this.nightEQ =
            this.audioContext.createBiquadFilter();
        this.nightEQ.type = 'highshelf';
        this.nightEQ.frequency.value = 3000;
        this.nightEQ.gain.value = 0;

        this.source
            .connect(this.gainNode);

        this.gainNode
            .connect(this.voiceEQ);

        this.voiceEQ
            .connect(this.nightEQ);

        this.nightEQ
            .connect(this.audioContext.destination);

        this.gainNode.gain.value = 1;
    },

    /* =========================
       CORE PLAY
    ========================= */
    play(button, src, title) {

        const same =
            this.state.currentButton === button &&
            decodeURI(this.audio.src).includes(src) &&
            !this.audio.paused;

        if (same) {
            this.pauseUI();
            return;
        }

        if (this.state.currentButton) {
            this.state.currentButton.innerHTML = '🔊';
        }

        this.state.currentButton = button;

        this.dom.bar.style.display = 'block';
        this.dom.show.style.display = 'none';
        this.dom.bar.classList.remove('hidden-bar');
        this.dom.bar.classList.remove('minimized');

        this.audio.src = src;
        this.audio.playbackRate = this.state.currentSpeed;
        this.audio.play();

        this.dom.nowPlaying.innerHTML = title;

        button.innerHTML = '⏸';
        this.dom.playBtn.innerHTML = '⏸';
    },

    pauseUI() {
        this.audio.pause();
        this.dom.bar.style.display = 'none';
        this.dom.show.style.display = 'none';

        if (this.state.currentButton) {
            this.state.currentButton.innerHTML = '🔊';
        }
    },

    /* =========================
       PLAY / PAUSE
    ========================= */
    togglePlay() {

        if (this.audio.paused) {
            this.audio.play();
            this.dom.playBtn.innerHTML = '⏸';
            if (this.state.currentButton) {
                this.state.currentButton.innerHTML = '⏸';
            }
        } else {
            this.audio.pause();
            this.dom.playBtn.innerHTML = '▶';
            if (this.state.currentButton) {
                this.state.currentButton.innerHTML = '🔊';
            }
        }
    },

    /* =========================
       NEXT / PREV
    ========================= */
    getButtons() {
        return Array.from(
            document.querySelectorAll('[onclick*="togglePaperAudio"]')
        );
    },

    extract(btn) {
        const m =
            btn.getAttribute('onclick')
            .match(/togglePaperAudio\(this,\s*'([^']+)'\s*,\s*'([^']+)'\)/);

        if (!m) return null;

        return { src: m[1], title: m[2] };
    },

    playByIndex(i) {

        const buttons = this.getButtons();
        if (i < 0 || i >= buttons.length) return;

        const btn = buttons[i];
        const data = this.extract(btn);
        if (!data) return;

        this.play(btn, data.src, data.title);
    },

    next() {
        const buttons = this.getButtons();
        const i = buttons.indexOf(this.state.currentButton);
        let n = i + 1;
        if (n >= buttons.length) n = 0;
        this.playByIndex(n);
    },

    prev() {
        const buttons = this.getButtons();
        const i = buttons.indexOf(this.state.currentButton);
        let p = i - 1;
        if (p < 0) p = buttons.length - 1;
        this.playByIndex(p);
    },

    /* =========================
       TIME
    ========================= */
    format(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${String(s).padStart(2,'0')}`;
    },

    updateTime() {
        this.dom.time.innerHTML =
        `${this.format(this.audio.currentTime)} / ${this.format(this.audio.duration || 0)}`;
    },

    /* =========================
       SLEEP TIMER
    ========================= */
    startSleepTimer() {

        const value = parseInt(this.dom.sleepInput.value);
        const unit = this.dom.sleepUnit.value;

        if (isNaN(value)) return alert('အချိန်ရိုက်ထည့်ပါ');

        let min = value;
        if (unit === 'hour') min *= 60;

        if (min < 1 || min > 480)
            return alert('1min - 8hr အတွင်းသာ');

        clearTimeout(this.state.sleepTimer);
        clearInterval(this.state.sleepInterval);

        this.state.sleepEndTime = Date.now() + min * 60000;

        this.state.sleepTimer = setTimeout(() => {
            this.audio.pause();
            this.dom.bar.style.display = 'none';
            if (this.state.currentButton)
                this.state.currentButton.innerHTML = '🔊';
            this.dom.sleepStatus.innerHTML = '⏰ Finished';
        }, min * 60000);

        this.state.sleepInterval = setInterval(() => {

            const remain = this.state.sleepEndTime - Date.now();
            if (remain <= 0) return clearInterval(this.state.sleepInterval);

            const t = Math.floor(remain / 1000);
            const h = Math.floor(t / 3600);
            const m = Math.floor((t % 3600) / 60);
            const s = t % 60;

            this.dom.sleepStatus.innerHTML =
                `😴 ${h}h ${m}m ${s}s`;

        }, 1000);

        this.dom.sleepStatus.innerHTML = '😴 Started';
    },

    cancelSleep() {
        clearTimeout(this.state.sleepTimer);
        clearInterval(this.state.sleepInterval);
        this.dom.sleepStatus.innerHTML = 'No Timer';
    },

    /* =========================
       EVENTS
    ========================= */
    bindEvents() {

        this.dom.playBtn.onclick = () => this.togglePlay();

        this.audio.addEventListener('timeupdate', () => {
            if (!this.audio.duration) return;
            this.dom.seekbar.value =
                (this.audio.currentTime / this.audio.duration) * 100;
            this.updateTime();
        });

        this.dom.seekbar.oninput = () => {
            this.audio.currentTime =
                (this.dom.seekbar.value / 100) * this.audio.duration;
        };

        this.dom.volume.oninput = () => {
            const v = parseInt(this.dom.volume.value);
            this.gainNode.gain.value = v / 100;
            this.dom.volumeDisplay.innerHTML = v + '%';
        };

        this.dom.faster.onclick = () => {
            if (this.state.currentSpeed < 3) {
                this.state.currentSpeed += 0.25;
                this.audio.playbackRate = this.state.currentSpeed;
                this.dom.speedDisplay.innerHTML = this.state.currentSpeed + 'x';
            }
        };

        this.dom.slower.onclick = () => {
            if (this.state.currentSpeed > 0.25) {
                this.state.currentSpeed -= 0.25;
                this.audio.playbackRate = this.state.currentSpeed;
                this.dom.speedDisplay.innerHTML = this.state.currentSpeed + 'x';
            }
        };

        this.dom.repeat.onclick = () => {
            this.state.repeatOne = !this.state.repeatOne;
            this.dom.repeat.classList.toggle('paper-mode-active', this.state.repeatOne);
        };

        this.dom.autoNext.onclick = () => {
            this.state.autoNext = !this.state.autoNext;
            this.dom.autoNext.classList.toggle('paper-mode-active', this.state.autoNext);
        };

        this.dom.voice.onclick = () => {
            this.state.voiceMode = !this.state.voiceMode;
            this.dom.voice.classList.toggle('paper-mode-active', this.state.voiceMode);
            this.voiceEQ.gain.value = this.state.voiceMode ? 8 : 0;
        };

        this.dom.night.onclick = () => {
            this.state.nightMode = !this.state.nightMode;
            this.dom.night.classList.toggle('paper-mode-active', this.state.nightMode);
            this.nightEQ.gain.value = this.state.nightMode ? -10 : 0;
        };

        this.audio.addEventListener('ended', () => {
            if (this.state.repeatOne) {
                this.audio.currentTime = 0;
                this.audio.play();
                return;
            }
            if (this.state.autoNext) {
                this.next();
                return;
            }
            this.dom.bar.style.display = 'none';
            if (this.state.currentButton)
                this.state.currentButton.innerHTML = '🔊';
        });

        this.dom.next.onclick = () => this.next();
        this.dom.prev.onclick = () => this.prev();

        this.dom.hide.onclick = () => {
            this.dom.bar.classList.add('hidden-bar');
            this.dom.show.style.display = 'flex';
        };

        this.dom.show.onclick = () => {
            this.dom.bar.classList.remove('hidden-bar');
            this.dom.show.style.display = 'none';
        };

        this.dom.minimize.onclick = () => {
            this.dom.bar.classList.toggle('minimized');
        };

        this.dom.close.onclick = () => {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.dom.bar.style.display = 'none';
            if (this.state.currentButton)
                this.state.currentButton.innerHTML = '🔊';
        };

        this.dom.sleepStart.onclick = () => this.startSleepTimer();
        this.dom.sleepCancel.onclick = () => this.cancelSleep();

        this.dom.download.onclick = () => {
            const src = this.audio.src;
            if (!src) return alert('အသံဖိုင်မရှိပါ');

            const a = document.createElement('a');
            a.href = src;

            const file = new URL(src).pathname.split('/').pop();
            a.download = decodeURIComponent(file);

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };

        this.audio.addEventListener('ended', () => this.updateTime());
    },

    /* =========================
       GLOBAL BUTTONS
    ========================= */
    bindGlobalButtons() {

        window.togglePaperAudio = (btn, src, title) => {
            this.play(btn, src, title);
        };

        window.playNextAudio = () => this.next();
        window.playPreviousAudio = () => this.prev();
    },

    /* =========================
       AUTO PLAY
    ========================= */
    handleAutoPlay() {

        window.addEventListener('load', () => {

            const params = new URLSearchParams(location.search);
            const hash = location.hash;

            if (params.get('autoplay') === '1' && hash) {

                setTimeout(() => {

                    const target = document.querySelector(hash);
                    if (!target) return;

                    const btn = target.querySelector('.speaker-btn');
                    if (btn) btn.click();

                }, 1200);
            }

        });
    }

};

/* =========================
   START
========================= */

document.addEventListener('DOMContentLoaded', () => {
    AUDIO.init();
});

window.AUDIO = AUDIO;

})();
