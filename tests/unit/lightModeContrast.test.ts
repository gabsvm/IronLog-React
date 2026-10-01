import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Helper to compute WCAG 2.1 relative luminance and contrast ratio
function relativeLuminance(r: number, g: number, b: number): number {
    const sRGB = [r, g, b].map(v => {
        const val = v / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

function contrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
    const l1 = relativeLuminance(...rgb1);
    const l2 = relativeLuminance(...rgb2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

describe('A4: Light Mode Contrast and Accent Tokens', () => {
    const indexCss = fs.readFileSync(path.resolve(__dirname, '../../index.css'), 'utf-8');
    const tailwindConfig = fs.readFileSync(path.resolve(__dirname, '../../tailwind.config.js'), 'utf-8');

    it('defines --accent-text token in :root and html.light', () => {
        expect(indexCss).toMatch(/--accent-text:\s*200\s+244\s+90;/);
        expect(indexCss).toMatch(/html\.light\s*\{[^}]*--accent-text:\s*77\s+101\s+12;/s);
    });

    it('achieves >= 4.5:1 WCAG AA contrast ratio in both light and dark modes', () => {
        // Parse the shipped token values out of index.css so the math checks
        // the real stylesheet instead of hardcoded copies of it.
        const readToken = (block: string, name: string): [number, number, number] => {
            const match = block.match(new RegExp(`${name}:\\s*(\\d+)\\s+(\\d+)\\s+(\\d+)`));
            expect(match, `${name} must be defined`).not.toBeNull();
            return [Number(match![1]), Number(match![2]), Number(match![3])];
        };

        const rootBlock = indexCss.match(/:root\s*\{([^}]*)\}/);
        expect(rootBlock).not.toBeNull();
        const lightBlock = indexCss.match(/html\.light\s*\{([^}]*)\}/);
        expect(lightBlock).not.toBeNull();

        // Light mode: accent text against the light surface-base.
        const lightContrast = contrastRatio(
            readToken(lightBlock![1], '--accent-text'),
            readToken(lightBlock![1], '--surface-base')
        );
        expect(lightContrast).toBeGreaterThanOrEqual(4.5);

        // Dark mode: accent text against the dark surface-base.
        const darkContrast = contrastRatio(
            readToken(rootBlock![1], '--accent-text'),
            readToken(rootBlock![1], '--surface-base')
        );
        expect(darkContrast).toBeGreaterThanOrEqual(4.5);
    });

    it('ensures text-primary classes are remapped to accent-text in html.light', () => {
        expect(indexCss).toContain('html.light .text-primary-300');
        expect(indexCss).toContain('html.light .text-primary-400');
        expect(indexCss).toContain('html.light .text-primary-500');
        expect(indexCss).toMatch(/html\.light \.text-primary-500\s*\{\s*color:\s*rgb\(var\(--accent-text\)\)\s*!important;/);
    });

    it('exposes text-accent in tailwind.config.js', () => {
        expect(tailwindConfig).toContain('accent: "rgb(var(--accent-text) / <alpha-value>)"');
    });

    it('covers common dark hex backgrounds in html.light remapping', () => {
        expect(indexCss).toContain('html.light .bg-\\[\\#17171b\\]');
        expect(indexCss).toContain('html.light .bg-\\[\\#18181c\\]');
        expect(indexCss).toContain('html.light .bg-\\[\\#1c1816\\]');
    });
});
