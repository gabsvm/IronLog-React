import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resetLocalData } from '../../services/localDataReset';
import { db } from '../../utils/db';
import { useStore, resetStorePersistence } from '../../lib/store';

describe('localDataReset', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        resetStorePersistence();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('clears localStorage, sessionStorage, and IndexedDB state while preserving unrelated origin keys', async () => {
        // Seed localStorage
        localStorage.setItem('il_test_key', 'value1');
        localStorage.setItem('ironlog_active_session', 'session_data');
        localStorage.setItem('unrelated_site_key', 'keep_this_unrelated_key');
        localStorage.setItem('other_app_token', 'secret123');
        sessionStorage.setItem('temp_data', 'temp');

        // Spy on db.clear
        const dbClearSpy = vi.spyOn(db, 'clear').mockResolvedValue(undefined);

        // Seed store
        useStore.setState({
            activeSession: { id: 1, name: 'Active', startTime: 1000, mesoId: 1, week: 1, exercises: [], dayIdx: 0 } as any,
            activeMeso: { id: 1, name: 'Meso', week: 1, duration: 5, mesoType: 'hyp_1', plan: [] } as any,
        });

        await resetLocalData();

        expect(dbClearSpy).toHaveBeenCalled();
        expect(localStorage.getItem('il_test_key')).toBeNull();
        expect(localStorage.getItem('ironlog_active_session')).toBeNull();
        expect(sessionStorage.getItem('temp_data')).toBeNull();
        expect(useStore.getState().activeSession).toBeNull();
        expect(useStore.getState().activeMeso).toBeNull();

        // Unrelated origin storage must survive
        expect(localStorage.getItem('unrelated_site_key')).toBe('keep_this_unrelated_key');
        expect(localStorage.getItem('other_app_token')).toBe('secret123');
    });

    it('preserves exact production preference keys if preservePreferences is specified', async () => {
        localStorage.setItem('il_theme_v1', 'dark');
        localStorage.setItem('il_lang_v1', 'es');
        localStorage.setItem('il_color_theme_v1', 'iron');
        localStorage.setItem('il_effects_mode', 'full');
        localStorage.setItem('il_logs_v16', '[{"id": 1}]');
        localStorage.setItem('unrelated_origin_key', 'preserved');

        vi.spyOn(db, 'clear').mockResolvedValue(undefined);

        await resetLocalData({ preservePreferences: true });

        // Exact production preference keys preserved
        expect(localStorage.getItem('il_theme_v1')).toBe('dark');
        expect(localStorage.getItem('il_lang_v1')).toBe('es');
        expect(localStorage.getItem('il_color_theme_v1')).toBe('iron');
        expect(localStorage.getItem('il_effects_mode')).toBe('full');

        // GainsLab domain data removed
        expect(localStorage.getItem('il_logs_v16')).toBeNull();

        // Unrelated origin key preserved
        expect(localStorage.getItem('unrelated_origin_key')).toBe('preserved');
    });

    it('cancels pending debounce timers so old session/meso are never re-persisted after reset', async () => {
        vi.useFakeTimers();

        const dbSetSpy = vi.spyOn(db, 'set').mockResolvedValue(undefined);
        vi.spyOn(db, 'clear').mockResolvedValue(undefined);

        // 1. Schedule a debounced session write
        const mockSession = { id: 999, name: 'Race Workout', startTime: 5000, mesoId: 1, week: 1, exercises: [], dayIdx: 0 } as any;
        useStore.getState().setActiveSession(mockSession);

        // 2. Trigger reset before 500 ms (at 200 ms)
        vi.advanceTimersByTime(200);
        await resetLocalData();

        // 3. Advance past the original debounce window
        vi.advanceTimersByTime(1000);

        // 4. Prove old session/meso were not reinserted
        expect(dbSetSpy).not.toHaveBeenCalledWith('il_session_v16', mockSession);
        expect(useStore.getState().activeSession).toBeNull();
        expect(useStore.getState().activeMeso).toBeNull();
    });
});
