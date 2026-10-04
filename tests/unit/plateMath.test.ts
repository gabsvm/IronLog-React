import { describe, it, expect } from 'vitest';
import { BAR_WEIGHT, STANDARD_PLATES_LB, calculatePlates } from '../../utils/plateMath';

describe('Q11: plateMath per unit', () => {
    it('keeps the legacy kg behavior by default (20 kg bar)', () => {
        expect(BAR_WEIGHT).toEqual({ kg: 20, lb: 45 });
        const { plates, remainder } = calculatePlates(100);
        expect(plates.map(p => p.weight)).toEqual([25, 15]);
        expect(remainder).toBe(0);
        // Explicit bar still wins.
        expect(calculatePlates(100, 20).plates.map(p => p.weight)).toEqual([25, 15]);
    });

    it('loads pound plates with a 45 lb bar by default', () => {
        expect(STANDARD_PLATES_LB.map(p => p.weight)).toEqual([45, 35, 25, 10, 5, 2.5]);
        // 135 lb → 45 per side → one 45 plate.
        const one = calculatePlates(135, undefined, null, 'lb');
        expect(one.plates.map(p => p.weight)).toEqual([45]);
        expect(one.remainder).toBe(0);
        // 225 lb → 90 per side → 45 + 45.
        const two = calculatePlates(225, undefined, null, 'lb');
        expect(two.plates.map(p => p.weight)).toEqual([45, 45]);
        expect(two.remainder).toBe(0);
        // 200 lb → 77.5 per side → 45 + 25 + 5 + 2.5, exact.
        const mixed = calculatePlates(200, undefined, null, 'lb');
        expect(mixed.plates.map(p => p.weight)).toEqual([45, 25, 5, 2.5]);
        expect(mixed.remainder).toBe(0);
    });

    it('reports the remainder when the target is not loadable', () => {
        const { remainder } = calculatePlates(137, undefined, null, 'lb');
        expect(remainder).toBeCloseTo(2, 6);
    });
});
