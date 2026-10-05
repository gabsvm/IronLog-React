import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { splitCriticalLazy } from '../../scripts/generate-sw-precache.mjs';

// S7: only the active language is downloaded. These tests use a fresh module
// instance (vi.resetModules) so the registry starts empty, unlike the shared
// test setup that preloads both languages.
const freshRegistry = async () => {
    vi.resetModules();
    return import('../../constants/translations');
};

describe('S7: lazy translation registry', () => {
    it('starts empty and loads exactly the requested language', async () => {
        const reg = await freshRegistry();
        expect(reg.isTranslationLoaded('es')).toBe(false);
        expect(reg.isTranslationLoaded('en')).toBe(false);
        await reg.loadTranslations('es');
        expect(reg.isTranslationLoaded('es')).toBe(true);
        expect(reg.isTranslationLoaded('en')).toBe(false);
        expect(reg.TRANSLATIONS.es.finishWorkout).toBe('Terminar');
    });

    it('is idempotent and shares concurrent loads', async () => {
        const reg = await freshRegistry();
        const [a, b] = [reg.loadTranslations('en'), reg.loadTranslations('en')];
        expect(a).toBe(b);
        await Promise.all([a, b]);
        const dict = reg.TRANSLATIONS.en;
        await reg.loadTranslations('en');
        expect(reg.TRANSLATIONS.en).toBe(dict);
    });

    it('bootLanguage mirrors AppContext: stored JSON value, else Spanish', async () => {
        const reg = await freshRegistry();
        const storage = (value: string | null) => ({ getItem: () => value });
        expect(reg.bootLanguage(storage('"en"'))).toBe('en');
        expect(reg.bootLanguage(storage('"es"'))).toBe('es');
        expect(reg.bootLanguage(storage(null))).toBe('es');
        expect(reg.bootLanguage(storage('"fr"'))).toBe('es');
        expect(reg.bootLanguage(storage('not json'))).toBe('es');
        expect(reg.bootLanguage(undefined)).toBe('es');
    });

    it('the app entry never imports a dictionary statically', () => {
        // Static imports of the per-language files would put both back in the entry chunk.
        const registry = readFileSync(resolve(process.cwd(), 'constants/translations.ts'), 'utf8');
        expect(registry).not.toMatch(/^import\s+\{[^}]*\}\s+from\s+'\.\/translations\.(en|es)'/m);
        expect(registry).toMatch(/import\('\.\/translations\.en'\)/);
        expect(registry).toMatch(/import\('\.\/translations\.es'\)/);
    });
});

describe('S7: precache marks both dictionaries as boot-critical', () => {
    it('dynamic translations chunks join the critical set; other dynamic chunks stay lazy', async () => {
        const files: Record<string, string> = {
            '/assets/index-abc.js': 'const t=import("./translations.es-111.js");const v=import("./StatsView-222.js");',
        };
        const { criticalList, lazyList } = await splitCriticalLazy({
            readTextFile: async (url: string) => files[url] ?? null,
            indexHtml: '<script type="module" src="/assets/index-abc.js"></script>',
            allAssets: ['/assets/index-abc.js', '/assets/translations.es-111.js', '/assets/translations.en-333.js', '/assets/StatsView-222.js'],
        });
        expect(criticalList).toEqual(['/assets/index-abc.js', '/assets/translations.en-333.js', '/assets/translations.es-111.js']);
        expect(lazyList).toEqual(['/assets/StatsView-222.js']);
    });
});
