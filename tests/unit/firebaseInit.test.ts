// Q4: single Firebase initializer — lazy SDK, cache per platform, firebase
// out of the critical precache set.
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { selectFirestoreCacheKind } from '../../lib/firebaseLoader';
import { splitCriticalLazy } from '../../scripts/generate-sw-precache.mjs';

describe('Q4: Firestore cache selection', () => {
    it('uses memory on native, emulator, or both — persistent only on web', () => {
        expect(selectFirestoreCacheKind({ useEmulator: false, isNativePlatform: false })).toBe('persistent');
        expect(selectFirestoreCacheKind({ useEmulator: false, isNativePlatform: true })).toBe('memory');
        expect(selectFirestoreCacheKind({ useEmulator: true, isNativePlatform: false })).toBe('memory');
        expect(selectFirestoreCacheKind({ useEmulator: true, isNativePlatform: true })).toBe('memory');
    });
});

describe('Q4: the loader never pulls Firebase statically', () => {
    it('lib/firebase.ts is gone and the loader has no static firebase imports', () => {
        expect(existsSync('lib/firebase.ts')).toBe(false);
        const source = readFileSync('lib/firebaseLoader.ts', 'utf8');
        for (const line of source.split('\n')) {
            if (line.includes("from 'firebase/") || line.includes('from "firebase/')) {
                expect(line.trim().startsWith('import type'), `static import leaked: ${line}`).toBe(true);
            }
        }
        expect(source).toContain("import('firebase/app')");
        expect(source).toContain("import('firebase/auth')");
        expect(source).toContain("import('firebase/firestore')");
    });
});

describe('Q4: precache split keeps lazy chunks out of critical', () => {
    it('classifies static imports critical and dynamic imports lazy (fixture)', async () => {
        const indexHtml = '<script type="module" src="./assets/entry-1.js"></script>';
        const files: Record<string, string> = {
            '/assets/entry-1.js':
                'import{a}from"./vendor-react-2.js";const m=await import("./vendor-firebase-db-3.js");console.log(a,m);',
            '/assets/vendor-react-2.js': 'export const a=1;',
            '/assets/vendor-firebase-db-3.js': 'export const m=2;',
        };
        const { criticalList, lazyList } = await splitCriticalLazy({
            readTextFile: async (url: string) => files[url] ?? null,
            indexHtml,
            allAssets: Object.keys(files),
        });
        expect(criticalList).toContain('/assets/entry-1.js');
        expect(criticalList).toContain('/assets/vendor-react-2.js');
        expect(criticalList).not.toContain('/assets/vendor-firebase-db-3.js');
        expect(lazyList).toContain('/assets/vendor-firebase-db-3.js');
    });
});

describe.skipIf(!existsSync('dist'))('Q4: real build has no firebase in the critical set', () => {
    it('no vendor-firebase chunk is statically reachable from the entry', async () => {
        const collect = (dir: string, base: string): string[] => {
            const out: string[] = [];
            for (const entry of readdirSync(dir, { withFileTypes: true })) {
                if (entry.isDirectory()) out.push(...collect(join(dir, entry.name), `${base}/${entry.name}`));
                else if (/\.(js|css|woff2?)$/.test(entry.name)) out.push(`${base}/${entry.name}`);
            }
            return out;
        };
        const allAssets = collect(join('dist', 'assets'), '/assets');
        const indexHtml = readFileSync(join('dist', 'index.html'), 'utf8');
        const { criticalList, lazyList } = await splitCriticalLazy({
            readTextFile: async (url: string) => {
                try {
                    return readFileSync(join('dist', url.replace(/^\//, '')), 'utf8');
                } catch {
                    return null;
                }
            },
            indexHtml,
            allAssets,
        });
        expect(criticalList.length).toBeGreaterThan(0);
        const criticalFirebase = criticalList.filter((u) => u.includes('vendor-firebase'));
        expect(criticalFirebase).toEqual([]);
        expect(lazyList.some((u) => u.includes('vendor-firebase-db'))).toBe(true);
    });
});
