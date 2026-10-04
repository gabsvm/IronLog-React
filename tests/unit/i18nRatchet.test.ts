import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
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
