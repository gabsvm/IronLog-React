import { describe, it, expect } from 'vitest';
import {
    formatLocalDateKey,
    todayLocalDateKey,
    parseLocalDateKey,
    addLocalDays,
    diffLocalDays,
    isValidLocalDateKey,
} from '../../utils/localDate';

describe('localDate utilities', () => {
    it('formats Date into YYYY-MM-DD using local calendar date', () => {
        const date = new Date(2026, 4, 15, 23, 45, 0); // May 15, 2026 23:45
        expect(formatLocalDateKey(date)).toBe('2026-05-15');
    });

    it('remains on local date even at 22:00 / 23:00 in UTC-negative timezones (preventing premature UTC rollover)', () => {
        // When it is 22:00 in Argentina (UTC-3), UTC time is 01:00 the NEXT day.
        // toISOString().split('T')[0] would mistakenly return the next day.
        // formatLocalDateKey must return the local calendar day.
        const lateNightLocal = new Date(2026, 8, 30, 22, 30, 0); // Sept 30, 2026 22:30 local
        expect(formatLocalDateKey(lateNightLocal)).toBe('2026-09-30');
    });

    it('parses YYYY-MM-DD into a valid Date at midnight local time', () => {
        const parsed = parseLocalDateKey('2026-10-01');
        expect(parsed.getFullYear()).toBe(2026);
        expect(parsed.getMonth()).toBe(9); // 0-indexed October is 9
        expect(parsed.getDate()).toBe(1);
        expect(parsed.getHours()).toBe(0);
        expect(parsed.getMinutes()).toBe(0);
    });

    it('adds and subtracts days safely across month and year boundaries', () => {
        expect(addLocalDays('2026-01-01', -1)).toBe('2025-12-31');
        expect(addLocalDays('2025-12-31', 1)).toBe('2026-01-01');
        expect(addLocalDays('2026-02-28', 1)).toBe('2026-03-01');
        expect(addLocalDays('2026-03-01', -1)).toBe('2026-02-28');
    });

    it('calculates calendar day differences accurately', () => {
        expect(diffLocalDays('2026-03-05', '2026-03-01')).toBe(4);
        expect(diffLocalDays('2026-03-01', '2026-03-05')).toBe(-4);
        expect(diffLocalDays('2026-01-02', '2025-12-31')).toBe(2);
    });

    it('validates local date key formats correctly', () => {
        expect(isValidLocalDateKey('2026-09-30')).toBe(true);
        expect(isValidLocalDateKey('2026-02-29')).toBe(false); // 2026 is not leap year
        expect(isValidLocalDateKey('invalid-date')).toBe(false);
        expect(isValidLocalDateKey('2026/09/30')).toBe(false);
    });
});
