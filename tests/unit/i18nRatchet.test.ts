import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { countLangTernaries } from '../../scripts/count-lang-ternaries.mjs';

// Q19 ratchet: inline `lang === 'es'` ternaries in shipped source must never
// grow past the recorded baseline. To lower it, migrate visible text to
// TRANSLATIONS and update tests/i18n-baseline.json in the same commit.
const baseline = JSON.parse(readFileSync('tests/i18n-baseline.json', 'utf8')) as { count: number };

describe('Q19: i18n ratchet on inline lang ternaries', () => {
    it('ternary count does not exceed the baseline', () => {
        const { count, files } = countLangTernaries();
        const top = Object.entries(files)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([f, n]) => `${f} (${n})`)
            .join(', ');
        expect(
            count,
            `lang ternaries grew past baseline (${count} > ${baseline.count}). Top files: ${top}`,
        ).toBeLessThanOrEqual(baseline.count);
    });

    it('baseline file holds a sane non-negative integer', () => {
        expect(Number.isInteger(baseline.count)).toBe(true);
        expect(baseline.count).toBeGreaterThanOrEqual(0);
    });
});

describe('S8: the counter sees every inline language branch', () => {
    it('counts es/en, === / !==, both quote styles and the isEs alias; ignores tests', () => {
        const root = mkdtempSync(join(tmpdir(), 'lang-ternaries-'));
        mkdirSync(join(root, 'src'));
        mkdirSync(join(root, 'tests'));
        writeFileSync(join(root, 'src', 'a.tsx'), [
            "const a = lang === 'es' ? 'Hola' : 'Hello';",
            'const b = lang==="en" ? "Hi" : "Hola";',
            "const c = lang !== 'en' ? 'x' : 'y';",
            "const isEs = pick(lang);",
            "const d = isEs ? 'x' : 'y';",
            "const ok = pickLang(lang, { es: 'x', en: 'y' });",
        ].join('\n'));
        writeFileSync(join(root, 'tests', 'b.test.ts'), "lang === 'es'");
        const { count, files } = countLangTernaries(root);
        expect(count).toBe(5);
        expect(Object.keys(files)).toEqual(['src/a.tsx']);
    });
});
