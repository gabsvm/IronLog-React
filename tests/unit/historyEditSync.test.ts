import { describe, it, expect } from 'vitest';
import type { Log } from '../../types';
import { hashLogContent, mergeSessionLogs, planSessionUpload, type SessionDoc } from '../../services/cloudLogsV2';
import { buildEditedLog, buildUndoLog, draftUpdateSet, toDraft } from '../../utils/historyEdit';

const original = (): Log => ({
    id: 7, dayIdx: 0, name: 'Push', startTime: 1000, endTime: 5000, duration: 4000, mesoId: 1, week: 1,
    exercises: [{
        id: 'bench', instanceId: 1, name: 'Bench', muscle: 'CHEST',
        sets: [{ id: 1, weight: 100, reps: 5, rpe: '', completed: true, type: 'regular' }],
    } as any],
});

// The cloud copy of the original was uploaded long after the workout ended.
const UPLOADED_AT = 90_000;
const cloudCopy = (log: Log): SessionDoc => ({ ...log, updatedAt: UPLOADED_AT });

const edit = (now: number) => {
    const base = original();
    const res = buildEditedLog(base, draftUpdateSet(toDraft(base, 'kg'), 1, 1, 'weight', '110'), 'kg', now);
    if (!res.ok) throw new Error('expected ok');
    return res.log;
};

describe('edited workouts vs cloud sync V2 (last-writer-wins)', () => {
    it('the edit is uploaded as a change and bumps the cloud stamp', () => {
        const base = original();
        const index = { '7': { u: UPLOADED_AT, h: hashLogContent(base) } };
        const edited = edit(100_000);
        const plan = planSessionUpload([edited], index, 100_001);
        expect(plan.upserts).toHaveLength(1);
        expect(plan.upserts[0].id).toBe('7');
        expect((plan.upserts[0].doc as any).updatedAt).toBeGreaterThan(UPLOADED_AT);
        expect((plan.upserts[0].doc as any).exercises[0].sets[0].weight).toBe(110);
    });

    it('a pull of the older cloud copy cannot overwrite a fresh local edit', () => {
        const edited = edit(100_000);
        const merged = mergeSessionLogs([edited], [cloudCopy(original())], 100_500);
        expect(merged).toHaveLength(1);
        expect(merged[0].exercises[0].sets[0].weight).toBe(110);
    });

    it('even with a device clock behind the cloud stamp, the edit stamp is never below the previous one', () => {
        const base = { ...original(), updatedAt: UPLOADED_AT };
        const res = buildEditedLog(base, draftUpdateSet(toDraft(base, 'kg'), 1, 1, 'weight', '110'), 'kg', 1);
        if (!res.ok) throw new Error('expected ok');
        expect(res.log.updatedAt).toBe(UPLOADED_AT + 1);
        const merged = mergeSessionLogs([res.log], [cloudCopy(original())], 100_500);
        expect(merged[0].exercises[0].sets[0].weight).toBe(110);
    });

    it('undo wins over the edit that was already uploaded', () => {
        const edited = edit(100_000);
        const undone = buildUndoLog(original(), edited, 100_100);
        const cloudEdited: SessionDoc = { ...edited, updatedAt: 100_050 };
        const merged = mergeSessionLogs([undone], [cloudEdited], 100_500);
        expect(merged[0].exercises[0].sets[0].weight).toBe(100);
    });

    it('an unchanged save produces no upload', () => {
        const base = original();
        const res = buildEditedLog(base, toDraft(base, 'kg'), 'kg', 200_000);
        if (!res.ok) throw new Error('expected ok');
        const index = { '7': { u: UPLOADED_AT, h: hashLogContent(base) } };
        expect(planSessionUpload([res.log], index, 200_001).upserts).toHaveLength(0);
    });
});
