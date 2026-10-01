import { describe, it, expect } from 'vitest';
import {
    extractHtmlAssetRefs,
    extractStaticImportRefs,
    splitCriticalLazy,
} from '../../scripts/generate-sw-precache.mjs';

describe('G5: precache critical/lazy split', () => {
    it('extracts script and stylesheet refs from index.html, ignoring external and image URLs', () => {
        const html = `
            <script type="module" src="/assets/index-abc.js"></script>
            <link rel="stylesheet" href="./assets/index-def.css" />
            <link rel="preload" href="/assets/branding/logo-lockup.png" as="image" />
            <script src="https://cdn.example.com/lib.js"></script>
        `;
        expect([...extractHtmlAssetRefs(html)].sort()).toEqual([
            '/assets/index-abc.js',
            '/assets/index-def.css',
        ]);
    });

    it('extracts static imports but never dynamic import() (minified output)', () => {
        const code = 'import{a as b}from"./vendor-react-x.js";export{c}from"./shared-y.js";import"./side-z.js";const m=await import("./WorkoutView-lazy.js");const n=import("./other-lazy.js");import{x}from"../outside.js";';
        expect([...extractStaticImportRefs(code, '/assets/index-abc.js')].sort()).toEqual([
            '/assets/shared-y.js',
            '/assets/side-z.js',
            '/assets/vendor-react-x.js',
        ]);
    });

    it('splits boot-reachable assets as critical and dynamic chunks as lazy', async () => {
        const files: Record<string, string> = {
            '/assets/index.css': 'body{}',
            '/assets/index.js': 'import{r}from"./vendor.js";const v=import("./StatsView.js");',
            '/assets/vendor.js': 'import{s}from"./shared.js";export const r=1;',
            '/assets/shared.js': 'export const s=1;',
            '/assets/StatsView.js': 'export default 1;',
        };
        const indexHtml = '<script type="module" src="/assets/index.js"></script><link rel="stylesheet" href="/assets/index.css" />';
        const { criticalList, lazyList } = await splitCriticalLazy({
            readTextFile: async (url: string) => files[url] ?? null,
            indexHtml,
            allAssets: Object.keys(files).sort(),
        });

        expect(criticalList).toEqual(['/assets/index.css', '/assets/index.js', '/assets/shared.js', '/assets/vendor.js']);
        expect(lazyList).toEqual(['/assets/StatsView.js']);
    });

    it('refuses to stamp when index.html references no precacheable assets', async () => {
        await expect(splitCriticalLazy({
            readTextFile: async () => null,
            indexHtml: '<html><body>no refs</body></html>',
            allAssets: ['/assets/index.js'],
        })).rejects.toThrow(/no precacheable assets/);
    });
});
