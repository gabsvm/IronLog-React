import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const swPath = path.join(distDir, 'sw.js');
const htmlPath = path.join(distDir, 'index.html');

const toPublicUrl = (value) => value.startsWith('/') ? value : `/${value.replace(/^\.\//, '')}`;

const extractHtmlAssets = (html) => {
  const matches = html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g);
  return [...matches].map((match) => toPublicUrl(match[1])).filter((asset) => asset.startsWith('/assets/'));
};

const extractStaticImports = (source, parentUrl) => {
  const imports = source.matchAll(/from["'](\.\/[^"']+\.js)["']/g);
  return [...imports].map((match) => toPublicUrl(path.posix.join(path.posix.dirname(parentUrl), match[1])));
};

const main = async () => {
  const html = await readFile(htmlPath, 'utf8');
  const pending = extractHtmlAssets(html);
  const assets = new Set(pending);

  // Precache only the application shell and its synchronous imports. Lazy
  // screens remain runtime-cached so installation stays light on mobile data.
  while (pending.length > 0) {
    const asset = pending.pop();
    if (!asset.endsWith('.js')) continue;

    const absolutePath = path.join(distDir, asset.slice(1));
    const source = await readFile(absolutePath, 'utf8');
    for (const importedAsset of extractStaticImports(source, asset)) {
      if (assets.has(importedAsset)) continue;
      assets.add(importedAsset);
      pending.push(importedAsset);
    }
  }

  const sortedAssets = [...assets].sort();
  const buildId = createHash('sha256').update(sortedAssets.join('\n')).digest('hex').slice(0, 12);
  const generatedEntries = sortedAssets.map((asset) => `  '${asset}',`).join('\n');

  let serviceWorker = await readFile(swPath, 'utf8');
  serviceWorker = serviceWorker.replace('__BUILD_ID__', buildId);
  serviceWorker = serviceWorker.replace('  /* __BUILD_PRECACHE_URLS__ */', generatedEntries);
  await writeFile(swPath, serviceWorker, 'utf8');

  console.log(`[pwa] Precaching ${sortedAssets.length} app-shell assets (cache ${buildId}).`);
};

main().catch((error) => {
  console.error('[pwa] Failed to generate the service-worker precache:', error);
  process.exitCode = 1;
});
