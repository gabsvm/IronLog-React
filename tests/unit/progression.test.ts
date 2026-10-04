import { describe, it, expect } from 'vitest';
import {
    formatProgressionReason,
    recommendProgram,
    recommendProgression,
} from '../../utils/recommendationEngine';
import { TRANSLATIONS } from '../../constants';

describe('Q15: recommendProgram goldens (behavior locked)', () => {
    const profile = (daysPerWeek: number, extra: Record<string, unknown> = {}) => ({
        experience: 'intermediate',
        daysPerWeek,
        goal: 'hypertrophy',
        sessionDuration: 'normal',
        ...extra,
    }) as any;

    it.each([
        [2, 'resensitization', 'rec_low_freq'],
        [3, 'wizard', 'rec_wizard'],
        [4, 'hyp_2', 'rec_4_day'],
        [5, 'hyp_1', 'rec_ppl'],
        [6, 'hyp_1', 'rec_ppl'],
    ])('%i days/week → %s (%s)', (days, mesoType, reasonKey) => {
        const result = recommendProgram(profile(days as number));
        expect(result.mesoType).toBe(mesoType);
        expect(result.reasonKey).toBe(reasonKey);
        expect(result.adjustedVolume).toBe(false);
        expect(result.template.length).toBeGreaterThan(0);
    });

    it('endurance goal overrides the frequency template', () => {
        const result = recommendProgram(profile(4, { goal: 'endurance' }));
        expect(result.mesoType).toBe('metabolite');
        expect(result.reasonKey).toBe('rec_endurance');
    });

    it('short sessions trim one set per slot (min 2) and flag the adjustment', () => {
        const normal = recommendProgram(profile(4));
        const short = recommendProgram(profile(4, { sessionDuration: 'short' }));
        expect(short.adjustedVolume).toBe(true);
        normal.template.forEach((day, d) => {
            day.slots.forEach((slot, s) => {
                expect(short.template[d]!.slots[s]!.setTarget).toBe(
                    Math.max(2, slot.setTarget - 1),
                );
            });
        });
    });
});

describe('Q15: recommendProgression table', () => {
    const set = (weight: number, reps: number | string, rpe?: number | string | null) => ({
        weight, reps, rpe: rpe ?? null, completed: true,
    });
    const range = { min: 8, max: 12 };

    it('suggests up at the top of the range with RIR on target', () => {
        const suggestion = recommendProgression({
            sets: [set(60, 12, 2), set(60, 12, 1)],
            range, rirTarget: 2, unit: 'kg',
        });
        expect(suggestion).toMatchObject({ action: 'up', deltaDisplay: 2.5, topReps: 12, rir: 1 });
    });

    it('suggests up on reps alone when no RIR was logged (legacy behavior)', () => {
        const suggestion = recommendProgression({
            sets: [set(60, 12), set(60, 12)],
            range, rirTarget: 2, unit: 'kg',
        });
        expect(suggestion?.action).toBe('up');
        expect(suggestion?.rir).toBeNull();
    });

    it('suggests up without a rep range (legacy {step} behavior)', () => {
        const suggestion = recommendProgression({
            sets: [set(60, 10, 2)], range: null, rirTarget: 2, unit: 'kg',
        });
        expect(suggestion).toMatchObject({ action: 'up', deltaDisplay: 2.5 });
    });

    it('uses the lb step in lb mode', () => {
        const suggestion = recommendProgression({
            sets: [set(60, 12, 2)], range, rirTarget: 2, unit: 'lb',
        });
        expect(suggestion).toMatchObject({ action: 'up', deltaDisplay: 5 });
    });

    it('holds at mid-range aiming +1 rep', () => {
        const suggestion = recommendProgression({
            sets: [set(60, 10, 2), set(60, 9, 2)],
            range, rirTarget: 2, unit: 'kg',
        });
        expect(suggestion).toMatchObject({ action: 'hold', deltaDisplay: 0, targetReps: 11 });
    });

    it('holds when the top is reached but RIR is over target', () => {
        const suggestion = recommendProgression({
            sets: [set(60, 12, 4), set(60, 12, 3)],
            range, rirTarget: 2, unit: 'kg',
        });
        expect(suggestion?.action).toBe('hold');
    });

    it('suggests down 5% below the floor of the range', () => {
        const suggestion = recommendProgression({
            sets: [set(60, 6, 2), set(60, 6, 2)],
            range, rirTarget: 2, unit: 'kg',
        });
        expect(suggestion?.action).toBe('down');
        expect(suggestion!.deltaDisplay).toBeCloseTo(-3, 5);
        expect(suggestion!.baseDisplay).toBeCloseTo(60, 5);
    });

    it.each([
        ['empty sets', []],
        ['incomplete set', [{ weight: 60, reps: 12, rpe: 2, completed: false }]],
        ['zero weight', [{ weight: 0, reps: 12, rpe: 2, completed: true }]],
        ['non-numeric reps', [{ weight: 60, reps: '', rpe: 2, completed: true }]],
    ])('returns null: %s', (_, sets) => {
        expect(recommendProgression({ sets: sets as any, range, rirTarget: 2, unit: 'kg' })).toBeNull();
    });
});

describe('Q15: progression reason lines', () => {
    it('formats es/en reasons with localized decimals', () => {
        const up = recommendProgression({
            sets: [{ weight: 60, reps: 12, rpe: 2, completed: true }],
            range: { min: 8, max: 12 }, rirTarget: 2, unit: 'kg',
        })!;
        expect(formatProgressionReason(TRANSLATIONS.es.progression, up, 'kg', 'es'))
            .toBe('Llegaste a 12 reps con RIR 2: +2,5 kg');
        expect(formatProgressionReason(TRANSLATIONS.en.progression, up, 'kg', 'en'))
            .toBe('You hit 12 reps at RIR 2: +2.5 kg');

        const hold = recommendProgression({
            sets: [{ weight: 60, reps: 10, rpe: null, completed: true }],
            range: { min: 8, max: 12 }, rirTarget: 2, unit: 'kg',
        })!;
        expect(formatProgressionReason(TRANSLATIONS.es.progression, hold, 'kg', 'es'))
            .toBe('Misma carga, apuntá a 11 reps');
        expect(formatProgressionReason(TRANSLATIONS.en.progression, hold, 'kg', 'en'))
            .toBe('Same load, aim for 11 reps');

        const down = recommendProgression({
            sets: [{ weight: 60, reps: 6, rpe: 2, completed: true }],
            range: { min: 8, max: 12 }, rirTarget: 2, unit: 'kg',
        })!;
        expect(formatProgressionReason(TRANSLATIONS.es.progression, down, 'kg', 'es'))
            .toBe('Bajá a 57 kg (6 reps con RIR 2)');
        expect(formatProgressionReason(TRANSLATIONS.en.progression, down, 'kg', 'en'))
            .toBe('Drop to 57 kg (6 reps at RIR 2)');
    });
});
