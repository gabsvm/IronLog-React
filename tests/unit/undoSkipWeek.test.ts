import { describe, it, expect } from 'vitest';
import { shouldRestoreWeekAfterUndoSkip, type SkippedWeekSnapshot } from '../../App';

describe('F6: undo-skip restores the week only when the skip advanced it', () => {
    const snapshot: SkippedWeekSnapshot = { mesoId: 7, week: 3, isDeload: false };

    it('restores when the same meso advanced exactly one week', () => {
        expect(shouldRestoreWeekAfterUndoSkip(snapshot, { id: 7, week: 4 })).toBe(true);
    });

    it('restores when the advance also cleared a deload flag', () => {
        const deloadSnapshot: SkippedWeekSnapshot = { mesoId: 7, week: 3, isDeload: true };
        expect(shouldRestoreWeekAfterUndoSkip(deloadSnapshot, { id: 7, week: 4 })).toBe(true);
    });

    it('does not restore when the week did not advance', () => {
        expect(shouldRestoreWeekAfterUndoSkip(snapshot, { id: 7, week: 3 })).toBe(false);
    });

    it('does not restore when the user advanced further manually', () => {
        expect(shouldRestoreWeekAfterUndoSkip(snapshot, { id: 7, week: 5 })).toBe(false);
    });

    it('does not restore when a different meso is active', () => {
        expect(shouldRestoreWeekAfterUndoSkip(snapshot, { id: 9, week: 4 })).toBe(false);
    });

    it('does not restore without snapshot or meso', () => {
        expect(shouldRestoreWeekAfterUndoSkip(null, { id: 7, week: 4 })).toBe(false);
        expect(shouldRestoreWeekAfterUndoSkip(snapshot, null)).toBe(false);
        expect(shouldRestoreWeekAfterUndoSkip(undefined, undefined)).toBe(false);
    });
});
