import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ICON_MAP } from '../../components/ui/Icon';
import { TRANSLATIONS } from '../../constants';
import { recommendProgram } from '../../utils/recommendationEngine';

const ROOT = join(__dirname, '..', '..');
const SKIP = new Set(['node_modules', 'dist', 'android', 'tests', 'docs', '.git', 'public', 'test-results', 'apk-out']);

const walk = (dir: string, out: string[] = []): string[] => {
    for (const name of readdirSync(dir)) {
        if (SKIP.has(name)) continue;
        const full = join(dir, name);
        const st = statSync(full);
        if (st.isDirectory()) walk(full, out);
        else if (/\.(ts|tsx)$/.test(name)) out.push(full);
    }
    return out;
};

describe('Icon registry', () => {
    it('registers every icon referenced by name (unregistered names render as an empty box)', () => {
        const known = new Set(Object.keys(ICON_MAP).map(k => k.toLowerCase()));
        const missing = new Map<string, string>();
        for (const file of walk(ROOT)) {
            const src = readFileSync(file, 'utf8');
            const refs = [
                ...src.matchAll(/<Icon[^>]*?\bname=["']([A-Za-z0-9]+)["']/g),
                ...src.matchAll(/\b(?:icon|iconName)\s*[:=]\s*["']([A-Z][A-Za-z0-9]+)["']/g),
            ];
            for (const m of refs) {
                if (!known.has(m[1].toLowerCase())) missing.set(m[1], file.slice(ROOT.length + 1));
            }
        }
        expect([...missing.entries()]).toEqual([]);
    });
});

describe('Onboarding recommendation reasons', () => {
    it('has a non-empty explanation in every language for every reason the engine can return', () => {
        const keys = new Set<string>();
        for (const daysPerWeek of [2, 3, 4, 5, 6]) {
            for (const goal of ['hypertrophy', 'strength', 'endurance'] as const) {
                keys.add(recommendProgram({ experience: 'intermediate', daysPerWeek, goal, sessionDuration: 'medium' }).reasonKey);
            }
        }
        expect(keys.size).toBeGreaterThanOrEqual(5);
        for (const lang of ['es', 'en'] as const) {
            const reasons = TRANSLATIONS[lang].wizard.reason as Record<string, string>;
            for (const key of keys) expect(reasons[key], `${lang}:${key}`).toBeTruthy();
        }
    });
});
