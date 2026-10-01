import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { resolveEffectsMode } from '../../utils/effectsProfile';
import tailwindConfig from '../../tailwind.config.js';

describe('Task L5: Clean CSS selectors, Ring size, and Adaptive Effects', () => {
    const rootDir = path.resolve(__dirname, '../../');
    const indexCss = fs.readFileSync(path.join(rootDir, 'index.css'), 'utf-8');
    const nativePerfCss = fs.readFileSync(path.join(rootDir, 'native-performance.css'), 'utf-8');

    it('ensures no substring or attribute class selectors exist in index.css and native-performance.css', () => {
        const substringPattern = /\[class[*~^$]=/g;
        expect(indexCss.match(substringPattern)).toBeNull();
        expect(nativePerfCss.match(substringPattern)).toBeNull();
    });

    it('ensures native-performance.css does not contain dead svg[width="152"] and uses 170', () => {
        expect(nativePerfCss).not.toContain("width='152'");
        expect(nativePerfCss).not.toContain('width="152"');
        expect(nativePerfCss).toContain("width='170'");
    });

    it('ensures native-performance.css uses .transition-all instead of [class*="transition-all"]', () => {
        expect(nativePerfCss).not.toContain("[class*='transition-all']");
        expect(nativePerfCss).toContain('.transition-all');
    });

    it('resolves low-end mobile devices (< 3GB RAM or <= 2 cores) to reduced in system mode', () => {
        expect(resolveEffectsMode({
            effectsMode: 'system',
            isMobileOrTouch: true,
            deviceMemory: 2,
            hardwareConcurrency: 4,
        })).toBe('reduced');

        expect(resolveEffectsMode({
            effectsMode: 'system',
            isMobileOrTouch: true,
            deviceMemory: 4,
            hardwareConcurrency: 2,
        })).toBe('reduced');
    });

    it('preserves balanced mode for standard 4GB/8-core mobile devices like Redmi Note 10', () => {
        expect(resolveEffectsMode({
            effectsMode: 'system',
            isMobileOrTouch: true,
            deviceMemory: 4,
            hardwareConcurrency: 8,
        })).toBe('balanced');
    });

    it('preserves balanced mode for Moto G86 Power (8GB RAM, 8 cores)', () => {
        expect(resolveEffectsMode({
            effectsMode: 'system',
            isMobileOrTouch: true,
            deviceMemory: 8,
            hardwareConcurrency: 8,
        })).toBe('balanced');
    });

    it('verifies tailwind config registers plugins for effects variants', () => {
        expect(tailwindConfig.plugins).toBeDefined();
        expect(tailwindConfig.plugins.length).toBeGreaterThan(0);
        let registeredVariants: string[] = [];
        const mockAddVariant = (name: string) => {
            registeredVariants.push(name);
        };
        tailwindConfig.plugins.forEach((plugin: any) => {
            if (typeof plugin === 'function') {
                plugin({ addVariant: mockAddVariant });
            }
        });
        expect(registeredVariants).toContain('effects-reduced');
        expect(registeredVariants).toContain('effects-balanced');
    });
});
