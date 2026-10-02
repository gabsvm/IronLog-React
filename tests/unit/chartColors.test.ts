import { describe, it, expect, afterEach } from 'vitest';
import {
    resolveCssVarColor,
    primaryChartColor,
    buildDoughnutData,
    PRIMARY_500_FALLBACK,
} from '../../utils/chartColors';
import { TRANSLATIONS } from '../../constants';

describe('K2: chart colors resolve CSS vars to concrete canvas-safe colors', () => {
    afterEach(() => {
        document.documentElement.removeAttribute('style');
    });

    it('resolves space-separated "R G B" vars to rgb()', () => {
        document.documentElement.style.setProperty('--primary-500', '196 241 58');
        expect(resolveCssVarColor('--primary-500', '#000000')).toBe('rgb(196, 241, 58)');
    });

    it('falls back when the variable is absent', () => {
        expect(resolveCssVarColor('--does-not-exist', '#123456')).toBe('#123456');
    });

    it('handles comma-separated and rgba values', () => {
        document.documentElement.style.setProperty('--c1', '10, 20, 30');
        expect(resolveCssVarColor('--c1', '#000000')).toBe('rgb(10, 20, 30)');
        document.documentElement.style.setProperty('--c2', '10 20 30 0.5');
        expect(resolveCssVarColor('--c2', '#000000')).toBe('rgba(10, 20, 30, 0.5)');
    });

    it('passes concrete colors through untouched', () => {
        document.documentElement.style.setProperty('--c3', '#ea580c');
        expect(resolveCssVarColor('--c3', '#000000')).toBe('#ea580c');
    });

    it('primaryChartColor tracks the theme var with a fixed fallback', () => {
        expect(primaryChartColor()).toBe(PRIMARY_500_FALLBACK);
        document.documentElement.style.setProperty('--primary-500', '59 130 246');
        expect(primaryChartColor()).toBe('rgb(59, 130, 246)');
    });

    it('doughnut dataset has no var() and labels come from TRANSLATIONS types', () => {
        document.documentElement.style.setProperty('--primary-500', '196 241 58');
        const setTypeDist = { regular: 10, top: 3, backoff: 5, drop: 2, myorep: 4, cluster: 1, giant: 2 };
        for (const lang of ['es', 'en'] as const) {
            const data = buildDoughnutData(setTypeDist, TRANSLATIONS[lang].types as Record<string, string>);
            const colors = data.datasets[0].backgroundColor;
            expect(colors).toHaveLength(7);
            for (const color of colors) {
                expect(color).not.toContain('var(');
            }
            expect(data.labels).toEqual(
                Object.keys(setTypeDist).map(k => (TRANSLATIONS[lang].types as Record<string, string>)[k] || k)
            );
            expect(data.datasets[0].data).toEqual(Object.values(setTypeDist));
        }
    });
});
