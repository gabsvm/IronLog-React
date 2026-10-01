import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('L1: Self-hosted Inter font & no render-blocking Google Fonts', () => {
    it('does not reference Google Fonts in index.html', () => {
        const html = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf-8');
        expect(html).not.toContain('fonts.googleapis.com');
        expect(html).not.toContain('fonts.gstatic.com');
    });

    it('does not reference Google Fonts in public/sw.js', () => {
        const sw = fs.readFileSync(path.resolve(__dirname, '../../public/sw.js'), 'utf-8');
        expect(sw).not.toContain('fonts.googleapis.com');
        expect(sw).not.toContain('fonts.gstatic.com');
    });

    it('imports @fontsource-variable/inter in index.tsx', () => {
        const indexTsx = fs.readFileSync(path.resolve(__dirname, '../../index.tsx'), 'utf-8');
        expect(indexTsx).toContain("@fontsource-variable/inter");
    });

    it('configures Inter Variable in tailwind.config.js', () => {
        const tailwindConfig = fs.readFileSync(path.resolve(__dirname, '../../tailwind.config.js'), 'utf-8');
        expect(tailwindConfig).toContain("Inter Variable");
    });
});
