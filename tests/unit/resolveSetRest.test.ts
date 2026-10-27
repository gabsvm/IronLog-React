import { describe, expect, it } from 'vitest';
import { resolveSetRestSeconds } from '../../utils/resolveSetRest';

const ex = (over: Record<string, unknown> = {}) => ({
    id: 'e1', muscle: 'CHEST', sets: [], ...over,
}) as any;

const cfg = {};

describe('resolveSetRestSeconds (Strong auto-rest parity)', () => {
    it('returns the in-flow duration for completed working sets', () => {
        expect(resolveSetRestSeconds({ type: 'regular', completed: true } as any, ex(), cfg)).toBe(120);
    });
    it('uses per-exercise override and warmup default', () => {
        expect(resolveSetRestSeconds({ type: 'regular', completed: true } as any, ex({ defaultRestSeconds: 45 }), cfg)).toBe(45);
        expect(resolveSetRestSeconds({ type: 'warmup', completed: true } as any, ex(), cfg)).toBe(60);
    });
    it('returns null when no rest applies', () => {
        expect(resolveSetRestSeconds({ type: 'emom', completed: true } as any, ex(), cfg)).toBeNull();
        expect(resolveSetRestSeconds({ type: 'drop', completed: true } as any, ex(), cfg)).toBeNull();
        expect(resolveSetRestSeconds(null, ex(), cfg)).toBeNull();
    });
    it('uses 2:00 for regular sets (Strong default)', () => {
        const v = resolveSetRestSeconds({ type: 'regular', completed: true } as any, ex(), cfg);
        expect(v).toBe(120);
    });
});
