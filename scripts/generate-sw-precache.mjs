import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const swPath = path.join(distDir, 'sw.js');
const assetsDir = path.join(distDir, 'assets');

// Every build artifact needed to render any screen offline: the sync shell,
// all lazy views/modals, styles and self-hosted fonts. Images stay out:
// branding essentials are already listed as OPTIONAL_PRECACHE_URLS in sw.js
// and the rest is served through the runtime cache.
const PRECACHE_EXTENSIONS = new Set(['.js', '.css', '.woff', '.woff2']);

const collectAssets = async (dir, base) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const urls = [];
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    const url = `${base}/${entry.name}`;
    if (entry.isDirectory()) {
      urls.push(...(await collectAssets(entryPath, url)));
    } else if (PRECACHE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      urls.push(url);
    }
  }
  return urls;
};

const main = async () => {
  const assets = (await collectAssets(assetsDir, '/assets')).sort();
  if (assets.length === 0) {
    throw new Error(`No precacheable assets found in ${assetsDir}. Run 'vite build' first.`);
  }

  const buildId = createHash('sha256').update(assets.join('\n')).digest('hex').slice(0, 12);
  const generatedEntries = assets.map((asset) => `  '${asset}',`).join('\n');

  let serviceWorker = await readFile(swPath, 'utf8');
  if (!serviceWorker.includes('__BUILD_ID__') || !serviceWorker.includes('/* __BUILD_PRECACHE_URLS__ */')) {
    throw new Error('sw.js is missing the __BUILD_ID__ / __BUILD_PRECACHE_URLS__ placeholders.');
  }
  serviceWorker = serviceWorker.replace('__BUILD_ID__', buildId);
  serviceWorker = serviceWorker.replace('  /* __BUILD_PRECACHE_URLS__ */', generatedEntries);
  await writeFile(swPath, serviceWorker, 'utf8');

  console.log(`[pwa] Precaching ${assets.length} build assets (shell + lazy views + styles + fonts, cache ${buildId}).`);
};

main().catch((error) => {
  console.error('[pwa] Failed to generate the service-worker precache:', error);
  process.exitCode = 1;
});
