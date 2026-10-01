import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { db } from '../../utils/db';
import { useStore, flushStorePersistence, resetStorePersistence } from '../../lib/store';

describe('storePersistence (D1)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        resetStorePersistence();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('flushes null to IndexedDB when pagehide/flush occurs before 500ms debounce', async () => {
        const dbSetSpy = vi.spyOn(db, 'set').mockResolvedValue(undefined);

        // Seed an active session and let it debounce
        useStore.getState().setActiveSession({ id: 1, name: 'Leg Day' } as any);
        vi.advanceTimersByTime(500);
        expect(dbSetSpy).toHaveBeenCalledWith('il_session_v16', expect.objectContaining({ id: 1 }));

        dbSetSpy.mockClear();

        // Clear session (set to null) and immediately flush before debounce (e.g. pagehide)
        useStore.getState().setActiveSession(null);
        // Do NOT advance 500ms; flush immediately
        flushStorePersistence();

        expect(dbSetSpy).toHaveBeenCalledWith('il_session_v16', null);
    });

    it('does not write during flush if isStoreLoading is true', async () => {
        const dbSetSpy = vi.spyOn(db, 'set').mockResolvedValue(undefined);

        useStore.setState({ isStoreLoading: true });
        useStore.getState().setActiveSession({ id: 2 } as any);

        flushStorePersistence();

        expect(dbSetSpy).not.toHaveBeenCalled();
    });

    it('resetStorePersistence clears timers and flags without calling db.set', () => {
        const dbSetSpy = vi.spyOn(db, 'set').mockResolvedValue(undefined);

        useStore.getState().setActiveSession({ id: 3 } as any);
        resetStorePersistence();

        // Advancing timers should not trigger db.set because timer was cleared
        vi.advanceTimersByTime(1000);
        expect(dbSetSpy).not.toHaveBeenCalled();

        // Flushing after reset should also do nothing because dirty flags were reset
        flushStorePersistence();
        expect(dbSetSpy).not.toHaveBeenCalled();
    });
});
