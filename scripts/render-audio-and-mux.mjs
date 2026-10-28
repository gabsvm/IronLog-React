import { chromium } from 'playwright';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const projectRoot = 'C:/Dev/IronLog-React';
const videoPath = path.join(projectRoot, 'public/kinetic-demo/repyntra-kinetic.mp4');
const audioWavPath = path.join(projectRoot, 'public/kinetic-demo/audio.wav');
const muxedVideoPath = path.join(projectRoot, 'public/kinetic-demo/repyntra-kinetic-muxed.mp4');

async function generateAudio() {
  console.log('[audio] Launching Chromium for OfflineAudioContext rendering...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Run in page context
  const wavBase64 = await page.evaluate(async () => {
    const sampleRate = 44100;
    const duration = 24.0;
    const totalSamples = Math.ceil(sampleRate * duration);
    const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);
    const bpm = 128;
    const beatSec = 60 / bpm;

    const master = offlineCtx.createGain();
    master.gain.value = 0.7;
    master.connect(offlineCtx.destination);

    // Helper functions
    function triggerKick(t0) {
      if (t0 >= duration) return;
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, t0);
      osc.frequency.exponentialRampToValueAtTime(38, t0 + 0.14);

      gain.gain.setValueAtTime(0.9, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);

      osc.connect(gain);
      gain.connect(master);
      osc.start(t0);
      osc.stop(t0 + 0.3);
    }

    function triggerSnare(t0) {
      if (t0 >= duration) return;
      const osc = offlineCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t0);
      osc.frequency.exponentialRampToValueAtTime(70, t0 + 0.08);

      const oscGain = offlineCtx.createGain();
      oscGain.gain.setValueAtTime(0.45, t0);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);

      osc.connect(oscGain);
      oscGain.connect(master);
      osc.start(t0);
      osc.stop(t0 + 0.15);

      const bufferSize = Math.floor(sampleRate * 0.14);
      const buffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = offlineCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1500, t0);

      const noiseGain = offlineCtx.createGain();
      noiseGain.gain.setValueAtTime(0.35, t0);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.13);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(master);

      noise.start(t0);
      noise.stop(t0 + 0.15);
    }

    function triggerHiHat(t0, open = false) {
      if (t0 >= duration) return;
      const bufferSize = Math.floor(sampleRate * (open ? 0.12 : 0.04));
      const buffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = offlineCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(8000, t0);

      const gain = offlineCtx.createGain();
      gain.gain.setValueAtTime(open ? 0.3 : 0.2, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + (open ? 0.11 : 0.038));

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      noise.start(t0);
      noise.stop(t0 + (open ? 0.12 : 0.04));
    }

    function triggerImpact(t0, big = false) {
      if (t0 >= duration) return;
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(big ? 90 : 130, t0);
      osc.frequency.exponentialRampToValueAtTime(28, t0 + (big ? 0.45 : 0.28));

      gain.gain.setValueAtTime(big ? 0.9 : 0.65, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + (big ? 0.5 : 0.32));

      osc.connect(gain);
      gain.connect(master);
      osc.start(t0);
      osc.stop(t0 + 0.55);
    }

    function triggerBass(t0, freq, dur = 0.22) {
      if (t0 >= duration) return;
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t0);

      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550, t0);
      filter.frequency.exponentialRampToValueAtTime(120, t0 + dur);

      gain.gain.setValueAtTime(0.4, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    }

    // Schedule all beats
    const totalBeats = Math.floor(duration / beatSec);
    const bassNotes = [55, 55, 65.41, 55, 73.42, 65.41, 55, 49]; // A1 progression
    for (let b = 0; b < totalBeats; b++) {
      const t = b * beatSec;
      
      // 4-on-the-floor kick
      triggerKick(t);

      // Bass pulse on 16th notes
      triggerBass(t, bassNotes[b % bassNotes.length], beatSec * 0.45);
      triggerBass(t + beatSec * 0.5, bassNotes[b % bassNotes.length], beatSec * 0.35);

      // Snare on 2 and 4
      if (b % 4 === 1 || b % 4 === 3) {
        triggerSnare(t);
      }

      // Hi-hats
      triggerHiHat(t, false);
      triggerHiHat(t + beatSec * 0.5, true);
      triggerHiHat(t + beatSec * 0.25, false);
      triggerHiHat(t + beatSec * 0.75, false);

      // Scene cuts / impacts every 8 beats (~3.75s)
      if (b % 8 === 0) {
        triggerImpact(t, b % 16 === 0);
      }
    }

    const renderedBuffer = await offlineCtx.startRendering();
    const ch0 = renderedBuffer.getChannelData(0);
    const ch1 = renderedBuffer.getChannelData(1);

    // Encode to WAV (16-bit PCM stereo)
    const numChannels = 2;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = totalSamples * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;
    const outBuf = new Uint8Array(totalSize);
    const view = new DataView(outBuf.buffer);

    function writeStr(offset, str) {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    }

    writeStr(0, 'RIFF');
    view.setUint32(4, totalSize - 8, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < totalSamples; i++) {
      let s0 = Math.max(-1, Math.min(1, ch0[i]));
      let s1 = Math.max(-1, Math.min(1, ch1[i]));
      view.setInt16(offset, s0 < 0 ? s0 * 0x8000 : s0 * 0x7FFF, true);
      view.setInt16(offset + 2, s1 < 0 ? s1 * 0x8000 : s1 * 0x7FFF, true);
      offset += 4;
    }

    // Convert to base64
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < outBuf.length; i += chunk) {
      binary += String.fromCharCode.apply(null, outBuf.subarray(i, i + chunk));
    }
    return btoa(binary);
  });

  await browser.close();

  const wavBuffer = Buffer.from(wavBase64, 'base64');
  fs.writeFileSync(audioWavPath, wavBuffer);
  console.log(`[audio] Wrote ${audioWavPath} (${(wavBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

  // Now mux with ffmpeg
  console.log('[audio] Muxing video with audio into MP4...');
  const res = spawnSync('ffmpeg', [
    '-y',
    '-i', videoPath,
    '-i', audioWavPath,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    '-movflags', '+faststart',
    muxedVideoPath
  ], { stdio: 'inherit' });

  if (res.status === 0 && fs.existsSync(muxedVideoPath)) {
    fs.unlinkSync(videoPath);
    fs.renameSync(muxedVideoPath, videoPath);
    fs.unlinkSync(audioWavPath);
    console.log('[audio] Successfully muxed stereo audio into repyntra-kinetic.mp4!');
  } else {
    console.error('[audio] Failed to mux with ffmpeg');
  }
}

generateAudio().catch(console.error);
