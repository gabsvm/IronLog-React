import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetLocalData } from '../../services/localDataReset';
import { db } from '../../utils/db';
import { useStore } from '../../lib/store';

describe('localDataReset', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    it('clears localStorage, sessionStorage, and IndexedDB state', async () => {
        // Seed localStorage
        localStorage.setItem('il_test_key', 'value1');
        localStorage.setItem('ironlog_active_session', 'session_data');
        localStorage.setItem('unrelated_site_key', 'keep_or_clear');
        sessionStorage.setItem('temp_data', 'temp');

        // Spy on db.clear
        const dbClearSpy = vi.spyOn(db, 'clear').mockResolvedValue(undefined);

        // Seed store
        useStore.setState({
            activeSession: { id: 1, name: 'Active', startTime: 1000, mesoId: 1, week: 1, exercises: [], dayIdx: 0 },
            activeMeso: { id: 1, name: 'Meso', week: 1, duration: 5, mesoType: 'hyp_1', plan: [] },
        });

        await resetLocalData();

        expect(dbClearSpy).toHaveBeenCalled();
        expect(localStorage.getItem('il_test_key')).toBeNull();
        expect(localStorage.getItem('ironlog_active_session')).toBeNull();
        expect(sessionStorage.getItem('temp_data')).toBeNull();
        expect(useStore.getState().activeSession).toBeNull();
        expect(useStore.getState().activeMeso).toBeNull();
    });

    it('preserves user preference keys if preservePreferences is specified', async () => {
        localStorage.setItem('il_theme', 'dark');
        localStorage.setItem('il_lang', 'es');
        localStorage.setItem('il_logs_v16', '[{"id": 1}]');

        vi.spyOn(db, 'clear').mockResolvedValue(undefined);

        await resetLocalData({ preservePreferences: true });

        expect(localStorage.getItem('il_theme')).toBe('dark');
        expect(localStorage.getItem('il_lang')).toBe('es');
        expect(localStorage.getItem('il_logs_v16')).toBeNull();
    });
});
