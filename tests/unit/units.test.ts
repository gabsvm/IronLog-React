import { describe, it, expect } from 'vitest';
import {
    KG_PER_LB,
    LB_PLATES,
    PROGRESSION_STEP,
    formatWeight,
    fromDisplay,
    platesFor,
    resolveWeightUnit,
    roundToPlates,
    toDisplay,
    unitLabel,
} from '../../utils/units';

describe('Q11: weight units (kg canonical, lb display)', () => {
    it('exposes the exact conversion constant', () => {
        expect(KG_PER_LB).toBe(0.45359237);
    });

    it('is identity in kg mode (golden current behavior)', () => {
        expect(toDisplay(60, 'kg')).toBe(60);
        expect(toDisplay(62.5, 'kg')).toBe(62.5);
        expect(fromDisplay(60, 'kg')).toBe(60);
        expect(fromDisplay(62.5, 'kg')).toBe(62.5);
    });

    it('converts 135 lb to kg with up to 4 decimals and back to 135.0', () => {
        const kg = fromDisplay(135, 'lb');
        expect(kg).toBe(61.235);
        expect(toDisplay(kg, 'lb')).toBe(135);
    });

    it('does not drift over 100 round-trips', () => {
        let display = 135;
        for (let i = 0; i < 100; i++) {
            display = toDisplay(fromDisplay(display, 'lb'), 'lb');
        }
        expect(display).toBe(135);
    });

    it('shows 0.1 precision in display space', () => {
        expect(toDisplay(60, 'lb')).toBe(132.3);
        expect(toDisplay(100, 'lb')).toBe(220.5);
    });

    it('formats with the locale decimal separator', () => {
        expect(formatWeight(60, 'kg', 'en')).toBe('60');
        expect(formatWeight(60, 'kg', 'es')).toBe('60');
        expect(formatWeight(62.5, 'kg', 'en')).toBe('62.5');
        expect(formatWeight(62.5, 'kg', 'es')).toBe('62,5');
        expect(formatWeight(61.235, 'lb', 'es')).toBe('135');
        expect(formatWeight(60, 'lb', 'en')).toBe('132.3');
    });

    it('uses a 2.5 kg / 5 lb progression step', () => {
        expect(PROGRESSION_STEP.kg).toBe(2.5);
        expect(PROGRESSION_STEP.lb).toBe(5);
    });

    it('rounds to real plate totals (2.5 kg / 5 lb increments)', () => {
        // 62 kg ≈ 136.7 lb → nearest loadable total is 135 lb.
        expect(toDisplay(roundToPlates(62, 'lb'), 'lb')).toBe(135);
        // 61.235 kg is exactly 135 lb → unchanged.
        expect(roundToPlates(61.235, 'lb')).toBe(61.235);
        // kg mode: nearest 2.5 total.
        expect(roundToPlates(61, 'kg')).toBe(60);
        expect(roundToPlates(62.5, 'kg')).toBe(62.5);
    });

    it('exposes the curated plate sets per unit', () => {
        expect(LB_PLATES).toEqual([45, 35, 25, 10, 5, 2.5]);
        expect(platesFor('lb')).toEqual([45, 35, 25, 10, 5, 2.5]);
        expect(platesFor('kg')).toEqual([25, 20, 15, 10, 5, 2.5, 1.25]);
    });

    it('labels units and normalizes unknown config values to kg', () => {
        expect(unitLabel('kg')).toBe('KG');
        expect(unitLabel('lb')).toBe('LBS');
        expect(resolveWeightUnit(undefined)).toBe('kg');
        expect(resolveWeightUnit({})).toBe('kg');
        expect(resolveWeightUnit({ weightUnit: 'lb' })).toBe('lb');
        expect(resolveWeightUnit({ weightUnit: 'kg' })).toBe('kg');
        expect(resolveWeightUnit({ weightUnit: 'stones' as never })).toBe('kg');
    });
});
