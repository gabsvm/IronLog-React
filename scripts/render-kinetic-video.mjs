// scripts/render-kinetic-video.mjs
// Renders the Repyntra kinetic film to an ultra-smooth hardware-accelerated H.264 MP4.
import { createServer } from 'node:http';
import { readFileSync, existsSync, createReadStream } from 'node:fs';
import { join, extname } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 60;
const DUR = 24.0;
const TOTAL_FRAMES = Math.round(DUR * FPS);
const OUT_FILE = 'public/kinetic-demo/repyntra-kinetic.mp4';

// 1. Static file server for public/kinetic-demo
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain',
};

const server = createServer((req, res) => {
  const cleanUrl = req.url.split('?')[0];
  const filePath = join('public/kinetic-demo', cleanUrl === '/' ? 'index.html' : cleanUrl);
  if (!existsSync(filePath)) {
    res.writeHead(404);
    return res.end();
  }
  const ext = extname(filePath);
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
  createReadStream(filePath).pipe(res);
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
console.log(`[renderer] Local server started on port ${port}`);

// 2. Spawn ffmpeg process
const ffmpeg = spawn('ffmpeg', [
  '-v', 'warning',
  '-y',
  '-f', 'image2pipe',
  '-vcodec', 'mjpeg',
  '-r', String(FPS),
  '-i', '-',
  '-c:v', 'libx264',
  '-preset', 'veryfast',
  '-crf', '19',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  OUT_FILE,
], {
  stdio: ['pipe', 'inherit', 'inherit'],
});

ffmpeg.on('error', err => {
  console.error('[ffmpeg] spawn error:', err);
  process.exit(1);
});

// 3. Launch headless browser
const browser = await chromium.launch({
  args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
});
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
});

await page.goto(`http://127.0.0.1:${port}/index.html?render=1`);
await page.waitForFunction(() => window.__ready === true);

// Set render dimensions on stage
await page.evaluate(({ w, h }) => {
  const root = document.getElementById('root');
  if (root) {
    const scale = Math.min(w / 1920, h / 1080);
    root.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }
}, { w: WIDTH, h: HEIGHT });

const cdp = await page.context().newCDPSession(page);
console.log(`[renderer] Rendering ${TOTAL_FRAMES} frames at ${FPS} FPS (${WIDTH}x${HEIGHT})...`);

const startTime = performance.now();
for (let f = 0; f < TOTAL_FRAMES; f++) {
  const t = f / FPS;
  await page.evaluate(time => window.__setTime(time), t);

  const { data } = await cdp.send('Page.captureScreenshot', {
    format: 'jpeg',
    quality: 92,
  });

  const buffer = Buffer.from(data, 'base64');
  const canWrite = ffmpeg.stdin.write(buffer);
  if (!canWrite) {
    await new Promise(r => ffmpeg.stdin.once('drain', r));
  }

  if (f > 0 && f % 120 === 0) {
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    const pct = ((f / TOTAL_FRAMES) * 100).toFixed(0);
    const fpsRate = (f / elapsed).toFixed(1);
    console.log(`[renderer] Frame ${f}/${TOTAL_FRAMES} (${pct}%) — ${fpsRate} fps (${elapsed}s elapsed)`);
  }
}

ffmpeg.stdin.end();

await new Promise((resolve, reject) => {
  ffmpeg.on('close', code => {
    if (code === 0) resolve();
    else reject(new Error(`ffmpeg exited with code ${code}`));
  });
});

await browser.close();
server.close();

const totalSec = ((performance.now() - startTime) / 1000).toFixed(1);
console.log(`[renderer] COMPLETE: Successfully rendered ${OUT_FILE} in ${totalSec}s!`);
