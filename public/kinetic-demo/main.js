// main.js: Repyntra Kinetic Film runtime engine.
// Supports responsive viewport scaling, procedural WebAudio beat generator,
// message-based parent control (KINETIC_CMD / KINETIC_STATE), seamless looping,
// and deterministic headless frame rendering (__seek / __setTime / __samples / __shutter / __film).

import { configure, setPalette, DUR, FPS, BPM, clamp } from './core.js';
import { Film } from './compositor.js';

// 1. Load spec and fonts
const spec = (await import('./spec.js')).default;
configure(spec);
setPalette(spec.palette || {});

try {
  await Promise.all([
    '900 100px Archivo',
    '500 20px JBM',
    '700 30px Inst',
    '400 30px Inst',
  ].map(f => document.fonts.load(f)));
} catch (e) {
  console.warn('Font load fallback:', e);
}

// 2. Load and sanitize Logo
const jsUrl = v => /^javascript:/i.test(v.replace(/[\s\u0000-\u001f]/g, ''));
function inertSvg(text) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = doc.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) return '';
  svg.querySelectorAll('script, foreignObject, iframe, object, embed').forEach(n => n.remove());
  svg.querySelectorAll('set, animate').forEach(n => {
    if (/href|^on/i.test(n.getAttribute('attributeName') || '')) n.remove();
  });
  for (const n of [svg, ...svg.querySelectorAll('*')]) {
    for (const a of [...n.attributes]) {
      if (/^on/i.test(a.name) || (/href$/i.test(a.name) && jsUrl(a.value))) n.removeAttribute(a.name);
    }
  }
  return new XMLSerializer().serializeToString(svg);
}

const files = ['spec.js', 'blocks.js', 'core.js', 'compositor.js', 'main.js', 'index.html'];
const texts = await Promise.all(files.map(u => fetch(u).then(r => (r.ok ? r.text() : '')).catch(() => '')));
const src = {
  code: texts.slice(0, 2).join('\n'),
  lines: texts.reduce((n, s) => n + (s ? s.trimEnd().split('\n').length : 0), 0),
};

const logo = spec.logo ? await fetch(spec.logo).then(r => (r.ok ? r.text() : '')).then(inertSvg).catch(() => '') : '';

// 3. Mount Film
const rootEl = document.getElementById('root');
const film = new Film(rootEl, { src, logo, spec });

// Expose deterministic capture globals for Playwright / headless renderer / test scripts
window.__film = {
  title: spec.title || 'Repyntra Kinetic Film',
  dur: DUR,
  fps: FPS,
  bpm: BPM,
  cues: film.cues,
  lines: src.lines,
  cuts: film.cuts(),
  music: spec.music || null,
  sounds: spec.sounds || {},
};
window.__samples = (t, dt) => film.samples(t, dt);
window.__shutter = t => film.shutter(t);
window.__seek = t => film.render(t);
window.__setTime = t => film.render(t);

film.render(0);
window.__ready = true;

// 4. Responsive Viewport Scaling
function handleResize() {
  const isRender = location.search.includes('render');
  if (isRender) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.min(vw / 1920, vh / 1080);
  if (rootEl) {
    rootEl.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }
}
window.addEventListener('resize', handleResize);
handleResize();

// 5. Procedural WebAudio Synthesizer (WebAudioBeat)
class WebAudioBeat {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = true;
    this.lastBeat = -1;
    this.scheduledCues = new Set();
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.65;
        this.master.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setValueAtTime(this.muted ? 0 : 0.65, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  triggerKick(now = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + now;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, t0);
    osc.frequency.exponentialRampToValueAtTime(38, t0 + 0.14);

    gain.gain.setValueAtTime(0.9, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);

    osc.connect(gain);
    gain.connect(this.master);

    osc.start(t0);
    osc.stop(t0 + 0.3);
  }

  triggerHiHat(now = 0, open = false) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + now;
    const bufferSize = this.ctx.sampleRate * (open ? 0.12 : 0.04);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, t0);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(open ? 0.35 : 0.22, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + (open ? 0.11 : 0.038));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);

    noise.start(t0);
    noise.stop(t0 + (open ? 0.12 : 0.04));
  }

  triggerSnare(now = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + now;

    // Body
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t0);
    osc.frequency.exponentialRampToValueAtTime(70, t0 + 0.08);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.5, t0);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + 0.15);

    // Snap noise
    const bufferSize = this.ctx.sampleRate * 0.14;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1500, t0);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t0);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.13);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.master);

    noise.start(t0);
    noise.stop(t0 + 0.15);
  }

  triggerImpact(big = false) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(big ? 90 : 130, t0);
    osc.frequency.exponentialRampToValueAtTime(28, t0 + (big ? 0.45 : 0.28));

    gain.gain.setValueAtTime(big ? 0.95 : 0.7, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + (big ? 0.5 : 0.32));

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + 0.55);
  }

  triggerSlash() {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, t0);
    filter.frequency.exponentialRampToValueAtTime(800, t0 + 0.16);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.17);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    noise.start(t0);
    noise.stop(t0 + 0.18);
  }

  tickAtTime(t) {
    if (!this.ctx || this.muted) return;
    const currentBeat = Math.floor(t * BPM / 60);
    if (currentBeat !== this.lastBeat) {
      this.lastBeat = currentBeat;
      // 4-on-the-floor kick
      if (currentBeat % 1 === 0) {
        this.triggerKick();
      }
      // Claps/Snares on beat 2 & 4
      if (currentBeat % 4 === 1 || currentBeat % 4 === 3) {
        this.triggerSnare();
      }
      // Closed HiHat on offbeats
      this.triggerHiHat(0.12, false);
    }
  }
}

const audio = new WebAudioBeat();

// 6. Preview & Embedded Controller Loop
const isRender = location.search.includes('render');
const isEmbed = location.search.includes('embed') || window !== window.parent;

if (!isRender) {
  let t = +(new URLSearchParams(location.search).get('t') || 0);
  let playing = true; // Auto-play in interactive demo
  let lastTime = performance.now();

  const playBtn = document.getElementById('btn-play');
  const audioBtn = document.getElementById('btn-audio');
  const restartBtn = document.getElementById('btn-restart');
  const scrubBar = document.getElementById('film-scrub');
  const timeLabel = document.getElementById('film-time');
  const controlsEl = document.getElementById('film-controls');

  if (isEmbed && controlsEl) {
    // Hide internal HUD bar when embedded inside Landing.tsx (parent provides RP 1:1 controls)
    controlsEl.classList.add('hidden');
  }

  const renderFrame = () => {
    film.render(t);
    const beat = (t * BPM / 60);

    if (scrubBar) scrubBar.value = t;
    if (timeLabel) {
      timeLabel.innerHTML = `${t.toFixed(2)}s / ${DUR.toFixed(2)}s · BEAT <b>${beat.toFixed(1)}</b>`;
    }

    if (playing) {
      audio.tickAtTime(t);
    }

    // Broadcast live state to parent React app
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'KINETIC_STATE',
        t,
        duration: DUR,
        playing,
        muted: audio.muted,
        beat,
      }, '*');
    }
  };

  const setPlaying = (play) => {
    playing = play;
    if (playing) {
      audio.ensureContext();
      lastTime = performance.now();
    }
    if (playBtn) {
      playBtn.textContent = playing ? '❚❚ PAUSE' : '▶ PLAY';
      playBtn.classList.toggle('active', playing);
    }
  };

  if (playBtn) {
    playBtn.onclick = () => setPlaying(!playing);
  }

  if (audioBtn) {
    audioBtn.onclick = () => {
      audio.ensureContext();
      const isMuted = audio.toggleMute();
      audioBtn.textContent = isMuted ? '🔇 MUTED' : '♫ SOUND ON';
      audioBtn.classList.toggle('active', !isMuted);
    };
  }

  if (restartBtn) {
    restartBtn.onclick = () => {
      t = 0;
      audio.lastBeat = -1;
      renderFrame();
    };
  }

  if (scrubBar) {
    scrubBar.max = DUR;
    scrubBar.oninput = () => {
      t = +scrubBar.value;
      audio.lastBeat = Math.floor(t * BPM / 60);
      renderFrame();
    };
  }

  // Keyboard navigation for preview
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      audio.ensureContext();
      setPlaying(!playing);
      e.preventDefault();
    }
    if (e.code === 'ArrowRight') {
      t = Math.min(DUR, t + 60 / BPM);
      renderFrame();
    }
    if (e.code === 'ArrowLeft') {
      t = Math.max(0, t - 60 / BPM);
      renderFrame();
    }
    if (e.code === 'KeyM') {
      audio.ensureContext();
      const isMuted = audio.toggleMute();
      if (audioBtn) {
        audioBtn.textContent = isMuted ? '🔇 MUTED' : '♫ SOUND ON';
        audioBtn.classList.toggle('active', !isMuted);
      }
    }
    if (/^Digit\d$/.test(e.code)) {
      t = DUR * (+e.code.slice(5)) / 10;
      renderFrame();
    }
  });

  // Enable audio context on any user tap/click
  window.addEventListener('pointerdown', () => audio.ensureContext(), { once: true });

  // Main animation RAF loop with seamless looping
  const animLoop = (now) => {
    if (playing) {
      const delta = (now - lastTime) / 1000;
      t += delta;
      // Seamless loop when reaching film end
      if (t >= DUR) {
        t = 0;
        audio.lastBeat = -1;
      }
      renderFrame();
    }
    lastTime = now;
    requestAnimationFrame(animLoop);
  };
  requestAnimationFrame(animLoop);
  renderFrame();

  // 7. PostMessage Command Listener from parent (Landing.tsx)
  window.addEventListener('message', e => {
    if (!e.data || e.data.type !== 'KINETIC_CMD') return;
    const cmd = e.data.cmd;
    audio.ensureContext();

    if (cmd === 'toggle-audio') {
      const isMuted = audio.toggleMute();
      if (audioBtn) {
        audioBtn.textContent = isMuted ? '🔇 MUTED' : '♫ SOUND ON';
        audioBtn.classList.toggle('active', !isMuted);
      }
    } else if (cmd === 'mute') {
      audio.setMuted(true);
      if (audioBtn) {
        audioBtn.textContent = '🔇 MUTED';
        audioBtn.classList.remove('active');
      }
    } else if (cmd === 'unmute') {
      audio.setMuted(false);
      if (audioBtn) {
        audioBtn.textContent = '♫ SOUND ON';
        audioBtn.classList.add('active');
      }
    } else if (cmd === 'restart') {
      t = 0;
      audio.lastBeat = -1;
      renderFrame();
    } else if (cmd === 'toggle-play') {
      setPlaying(!playing);
    } else if (cmd === 'play') {
      setPlaying(true);
    } else if (cmd === 'pause') {
      setPlaying(false);
    } else if (cmd === 'seek' && typeof e.data.t === 'number') {
      t = clamp(e.data.t, 0, DUR);
      audio.lastBeat = Math.floor(t * BPM / 60);
      renderFrame();
    }
  });
}
