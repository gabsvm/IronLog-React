import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const normalizeAssetUrl = (raw) => {
  let cleaned = raw.trim().replace(/^\.\//, '');
  if (!cleaned.startsWith('/')) cleaned = `/${cleaned}`;
  // Only same-origin dist/assets entries are precacheable.
  if (!cleaned.startsWith('/assets/')) return null;
  if (!PRECACHE_EXTENSIONS.has(path.extname(cleaned.split('?')[0]).toLowerCase())) return null;
  return cleaned.split('?')[0];
};

/** Script + stylesheet assets referenced by dist/index.html (entry chunk, CSS). */
export const extractHtmlAssetRefs = (indexHtml) => {
  const refs = new Set();
  const patterns = [
    /<script[^>]*\ssrc=["']([^"']+)["']/gi,
    /<link[^>]*\shref=["']([^"']+)["']/gi,
  ];
  for (const pattern of patterns) {
    for (const match of indexHtml.matchAll(pattern)) {
      const normalized = normalizeAssetUrl(match[1]);
      if (normalized) refs.add(normalized);
    }
  }
  return refs;
};

/**
 * Static `import`/`export ... from` specifiers of a JS chunk. Dynamic
 * `import(...)` never matches (paren instead of quote), so lazy chunks stay
 * out of the critical set even in minified output (`}from"./x.js"`).
 */
export const extractStaticImportRefs = (chunkCode, fromUrl) => {
  const refs = new Set();
  const baseDir = path.posix.dirname(fromUrl);
  const patterns = [
    /\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*["']([^"']+)["']/g,
  ];
  for (const pattern of patterns) {
    for (const match of chunkCode.matchAll(pattern)) {
      const specifier = match[1];
      if (!specifier.startsWith('.')) continue;
      const normalized = normalizeAssetUrl(path.posix.join(baseDir, specifier));
      if (normalized) refs.add(normalized);
    }
  }
  return refs;
};

/**
 * Split collected assets into CRITICAL (shell + everything statically
 * reachable from dist/index.html, needed for boot) and LAZY (the rest:
 * dynamic chunks cached best-effort at install, runtime-cached otherwise).
 */
/** Dynamic chunks that boot cannot do without (see splitCriticalLazy). */
export const BOOT_CRITICAL_DYNAMIC = /\/translations\.(?:en|es)-[\w-]+\.js$/;

export const splitCriticalLazy = async ({ readTextFile, indexHtml, allAssets }) => {
  const critical = new Set();
  const queue = [...extractHtmlAssetRefs(indexHtml)];
  if (queue.length === 0) {
    throw new Error('dist/index.html references no precacheable assets; cannot determine the critical set.');
  }
  const seen = new Set();
  while (queue.length > 0) {
    const url = queue.pop();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    critical.add(url);
    if (!url.endsWith('.js')) continue;
    const code = await readTextFile(url);
    if (code === null) continue;
    for (const ref of extractStaticImportRefs(code, url)) {
      if (!seen.has(ref)) queue.push(ref);
    }
  }
  // S7: index.tsx awaits the active language chunk before rendering, so both
  // language dictionaries are boot-critical even though they load dynamically.
  for (const url of allAssets) {
    if (BOOT_CRITICAL_DYNAMIC.test(url)) critical.add(url);
  }
  const assetSet = new Set(allAssets);
  const criticalList = [...critical].filter((url) => assetSet.has(url)).sort();
  const criticalSet = new Set(criticalList);
  const lazyList = allAssets.filter((url) => !criticalSet.has(url)).sort();
  return { criticalList, lazyList };
};

const main = async () => {
  const assets = (await collectAssets(assetsDir, '/assets')).sort();
  if (assets.length === 0) {
    throw new Error(`No precacheable assets found in ${assetsDir}. Run 'vite build' first.`);
  }

  const indexHtml = await readFile(path.join(distDir, 'index.html'), 'utf8');
  const readTextFile = async (url) => {
    try {
      return await readFile(path.join(distDir, url.replace(/^\//, '')), 'utf8');
    } catch {
      return null;
    }
  };
  const { criticalList, lazyList } = await splitCriticalLazy({ readTextFile, indexHtml, allAssets: assets });
  if (criticalList.length === 0) {
    throw new Error('Critical precache set is empty; refusing to stamp sw.js.');
  }

  const buildId = createHash('sha256').update(assets.join('\n')).digest('hex').slice(0, 12);
  const renderList = (list) => list.map((asset) => `  '${asset}',`).join('\n');

  let serviceWorker = await readFile(swPath, 'utf8');
  const markers = ['__BUILD_ID__', '/* __BUILD_CRITICAL_URLS__ */', '/* __BUILD_LAZY_URLS__ */'];
  const missing = markers.filter((marker) => !serviceWorker.includes(marker));
  if (missing.length > 0) {
    throw new Error(`sw.js is missing placeholders: ${missing.join(', ')}.`);
  }
  serviceWorker = serviceWorker.replace('__BUILD_ID__', buildId);
  serviceWorker = serviceWorker.replace('  /* __BUILD_CRITICAL_URLS__ */', renderList(criticalList));
  serviceWorker = serviceWorker.replace('  /* __BUILD_LAZY_URLS__ */', renderList(lazyList));
  await writeFile(swPath, serviceWorker, 'utf8');

  console.log(
    `[pwa] Precaching ${assets.length} build assets ` +
    `(${criticalList.length} critical + ${lazyList.length} lazy, cache ${buildId}).`
  );
};

const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => {
    console.error('[pwa] Failed to generate the service-worker precache:', error);
    process.exitCode = 1;
  });
}
