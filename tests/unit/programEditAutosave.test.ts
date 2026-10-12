import { describe, it, expect } from 'vitest';
import { isSamePlan } from '../../views/programEdit/useProgramEditState';

describe('isSamePlan (program editor autosave must stop once the plan is saved)', () => {
    it('treats identical plans as equal and any real change as different', () => {
        const plan = [['bench', 'row'], ['squat', null]];
        expect(isSamePlan([['bench', 'row'], ['squat', null]], plan)).toBe(true);
        expect(isSamePlan([['bench', 'row'], ['squat', 'rdl']], plan)).toBe(false); // slot changed
        expect(isSamePlan([['bench'], ['squat', null]], plan)).toBe(false); // slot removed
        expect(isSamePlan([['bench', 'row']], plan)).toBe(false); // day removed
        expect(isSamePlan([['bench', 'row'], ['squat', null], []], plan)).toBe(false); // day added
    });

    it('treats a missing saved plan as different', () => {
        expect(isSamePlan([['a']], undefined)).toBe(false);
        expect(isSamePlan([], [])).toBe(true);
    });
});
