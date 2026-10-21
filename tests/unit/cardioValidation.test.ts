import { describe, expect, it } from 'vitest';
import { isValidCardioEntry } from '../../utils/cardioValidation';

describe('cardio entry validation', () => {
    it('requires a finite positive duration and rejects durations over 24 hours', () => {
        expect(isValidCardioEntry(1)).toBe(true);
        expect(isValidCardioEntry(1440)).toBe(true);
        expect(isValidCardioEntry(0)).toBe(false);
        expect(isValidCardioEntry(-1)).toBe(false);
        expect(isValidCardioEntry(1441)).toBe(false);
        expect(isValidCardioEntry(Number.NaN)).toBe(false);
    });

    it('accepts empty optional measurements and rejects values outside realistic input bounds', () => {
        expect(isValidCardioEntry(30)).toBe(true);
        expect(isValidCardioEntry(30, 0, 30)).toBe(true);
        expect(isValidCardioEntry(30, 1000, 250)).toBe(true);
        expect(isValidCardioEntry(30, -0.1)).toBe(false);
        expect(isValidCardioEntry(30, 1000.1)).toBe(false);
        expect(isValidCardioEntry(30, undefined, 29)).toBe(false);
        expect(isValidCardioEntry(30, undefined, 251)).toBe(false);
    });
});
