// Counts `lang === 'es'` ternaries (and quote/spacing variants) in app source.
// Used by the Q19 i18n ratchet: the count must never exceed tests/i18n-baseline.json.
// Excludes tests, tooling, generated code and platform projects — only the
// shipped web source counts.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');

const EXCLUDED_DIRS = new Set([
    'node_modules', 'dist', 'android', 'ios', 'tests', 'scripts', 'coverage',
    'playwright-report', 'test-results', 'apk-out', 'ironlog-kmp', '.git',
    '.Muse', '.agents', '.sl', '.hg', '.eden',
]);

const INCLUDE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

// lang === 'es' with either quote style and any spacing (also matches lang==='es').
const PATTERN = /lang\s*===\s*['"]es['"]/g;

export function countLangTernaries(root = ROOT) {
    const perFile = {};
    let total = 0;

    const walk = (dir) => {
        for (const entry of readdirSync(dir)) {
            const full = join(dir, entry);
            const st = statSync(full);
            if (st.isDirectory()) {
                if (!EXCLUDED_DIRS.has(entry)) walk(full);
                continue;
            }
            const dot = entry.lastIndexOf('.');
            const ext = dot === -1 ? '' : entry.slice(dot);
            if (!INCLUDE_EXT.has(ext)) continue;
            if (entry.endsWith('.d.ts')) continue;
            if (/[.](test|spec)[.]/.test(entry)) continue;
            const text = readFileSync(full, 'utf8');
            const matches = text.match(PATTERN);
            if (matches && matches.length > 0) {
                const rel = relative(root, full).split(sep).join('/');
                perFile[rel] = matches.length;
                total += matches.length;
            }
        }
    };
    walk(root);
    return { count: total, files: perFile };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
    console.log(JSON.stringify(countLangTernaries(), null, 2));
}
