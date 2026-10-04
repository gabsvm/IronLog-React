// Q20 bundle budget: gzip sizes per chunk, critical/lazy split (reused from
// the precache script), BUNDLE_REPORT.md output, and budget enforcement.
//
// Usage:
//   node scripts/bundle-report.mjs [distDir] [--budget path] [--report path]
//   node scripts/bundle-report.mjs --write-budget   # (re)create budget = now + 5%
// Exit 0 when within budget, 1 when over (or budget file missing).
import { gzipSync } from 'node:zlib';
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitCriticalLazy } from './generate-sw-precache.mjs';

const ROOT = resolve(join(dirname(fileURLToPath(import.meta.url)), '..'));
const HEADROOM = 1.05;

const PRECACHE_EXTENSIONS = new Set(['.js', '.css', '.woff', '.woff2']);

export function collectDistAssets(assetsDir, base = '/assets') {
    const urls = [];
    const walk = (dir, prefix) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const full = join(dir, entry.name);
            const url = `${prefix}/${entry.name}`;
            if (entry.isDirectory()) {
                walk(full, url);
            } else {
                const dot = entry.name.lastIndexOf('.');
                const ext = dot === -1 ? '' : entry.name.slice(dot).toLowerCase();
                if (PRECACHE_EXTENSIONS.has(ext)) urls.push(url);
            }
        }
    };
    walk(assetsDir, base);
    return urls.sort();
}

/** Entry chunk = the .js file loaded by dist/index.html's module script tag. */
export function findEntryChunk(indexHtml) {
    const match = indexHtml.match(/<script[^>]*\ssrc=["']([^"']+)["']/i);
    if (!match) return null;
    let cleaned = match[1].trim().replace(/^\.\//, '');
    if (!cleaned.startsWith('/')) cleaned = `/${cleaned}`;
    return cleaned.split('?')[0];
}

export function gzipSizeBytes(filePath) {
    return gzipSync(readFileSync(filePath)).length;
}

export async function analyzeDist(distDir) {
    const dist = resolve(distDir);
    const assetsDir = join(dist, 'assets');
    if (!existsSync(join(dist, 'index.html'))) {
        throw new Error(`no index.html in ${dist}; run 'vite build' first.`);
    }
    if (!existsSync(assetsDir)) {
        throw new Error(`no assets dir in ${dist}; run 'vite build' first.`);
    }
    const indexHtml = readFileSync(join(dist, 'index.html'), 'utf8');
    const allAssets = collectDistAssets(assetsDir);
    const readTextFile = (url) => {
        try {
            return readFileSync(join(dist, url.replace(/^\//, '')), 'utf8');
        } catch {
            return null;
        }
    };
    const { criticalList, lazyList } = await splitCriticalLazy({ readTextFile, indexHtml, allAssets });
    const criticalSet = new Set(criticalList);
    const entryUrl = findEntryChunk(indexHtml);

    const files = allAssets.map((url) => {
        const full = join(dist, url.replace(/^\//, ''));
        const raw = statSync(full).size;
        const gzip = gzipSizeBytes(full);
        return { url, raw, gzip, critical: criticalSet.has(url), entry: url === entryUrl };
    });
    const sum = (list) => list.reduce((acc, f) => acc + f.gzip, 0);
    const entry = files.find((f) => f.entry) || null;
    return {
        files,
        entry,
        entryJsGzip: entry ? entry.gzip : 0,
        criticalTotalGzip: sum(files.filter((f) => f.critical)),
        lazyTotalGzip: sum(files.filter((f) => !f.critical)),
    };
}

const kb = (bytes) => `${(bytes / 1024).toFixed(2)} KB`;

export function renderReport(analysis, budget, status) {
    const lines = [
        '# GainsLab bundle report (Q20)',
        '',
        `Entry chunk: \`${analysis.entry ? analysis.entry.url : '(not found)'}\` — gzip ${kb(analysis.entryJsGzip)} (budget ${budget ? kb(budget.entryJsGzip) : 'n/a'}).`,
        `Critical precache total: gzip ${kb(analysis.criticalTotalGzip)} (budget ${budget ? kb(budget.criticalTotalGzip) : 'n/a'}).`,
        `Lazy precache total: gzip ${kb(analysis.lazyTotalGzip)}.`,
        `Status: **${status}**.`,
        '',
        '| file | raw | gzip | set |',
        '| --- | --- | --- | --- |',
    ];
    const sorted = [...analysis.files].sort((a, b) => b.gzip - a.gzip);
    for (const f of sorted) {
        const set = f.entry ? 'ENTRY (critical)' : f.critical ? 'critical' : 'lazy';
        lines.push(`| \`${f.url}\` | ${kb(f.raw)} | ${kb(f.gzip)} | ${set} |`);
    }
    lines.push('');
    return lines.join('\n');
}

const parseArgs = (argv) => {
    const opts = { distDir: join(ROOT, 'dist'), budgetPath: join(ROOT, 'bundle-budget.json'), reportPath: null, writeBudget: false };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--write-budget') opts.writeBudget = true;
        else if (arg === '--budget') opts.budgetPath = resolve(argv[++i]);
        else if (arg === '--report') opts.reportPath = resolve(argv[++i]);
        else if (!arg.startsWith('--')) opts.distDir = resolve(arg);
        else throw new Error(`unknown flag ${arg}`);
    }
    if (!opts.reportPath) opts.reportPath = join(ROOT, 'docs', 'BUNDLE_REPORT.md');
    return opts;
};

const main = async (argv) => {
    const opts = parseArgs(argv);
    const analysis = await analyzeDist(opts.distDir);

    if (opts.writeBudget) {
        const budget = {
            entryJsGzip: Math.ceil(analysis.entryJsGzip * HEADROOM),
            criticalTotalGzip: Math.ceil(analysis.criticalTotalGzip * HEADROOM),
            generatedAt: new Date().toISOString(),
        };
        writeFileSync(opts.budgetPath, `${JSON.stringify(budget, null, 2)}\n`);
        console.log(`bundle budget written to ${opts.budgetPath} (current + 5%)`);
    }

    let budget = null;
    let status = 'WITHIN BUDGET';
    if (existsSync(opts.budgetPath)) {
        budget = JSON.parse(readFileSync(opts.budgetPath, 'utf8'));
    } else if (!opts.writeBudget) {
        status = 'NO BUDGET FILE';
    }
    const violations = [];
    if (budget) {
        if (analysis.entryJsGzip > budget.entryJsGzip) {
            violations.push(`entry ${kb(analysis.entryJsGzip)} > budget ${kb(budget.entryJsGzip)}`);
        }
        if (analysis.criticalTotalGzip > budget.criticalTotalGzip) {
            violations.push(`critical total ${kb(analysis.criticalTotalGzip)} > budget ${kb(budget.criticalTotalGzip)}`);
        }
        if (violations.length > 0) status = 'OVER BUDGET';
    }

    writeFileSync(opts.reportPath, renderReport(analysis, budget, status));
    console.log(`entry gzip ${kb(analysis.entryJsGzip)} | critical gzip ${kb(analysis.criticalTotalGzip)} | lazy gzip ${kb(analysis.lazyTotalGzip)} → ${status}`);
    if (status === 'NO BUDGET FILE') {
        console.error(`missing ${opts.budgetPath}; create it with --write-budget`);
        return 1;
    }
    for (const v of violations) console.error(`over budget: ${v}`);
    return violations.length > 0 ? 1 : 0;
};

const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url);
if (invokedDirectly) {
    main(process.argv.slice(2)).then(
        (code) => { process.exitCode = code; },
        (error) => { console.error('[bundle] failed:', error); process.exitCode = 2; },
    );
}
