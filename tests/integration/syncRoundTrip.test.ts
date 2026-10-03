// Q1: full syncService.uploadState → downloadState round trip against emulators.
import { describe, it, expect, beforeAll } from 'vitest';
import { emulatorsRunning } from './setup';
import { getFirebaseAuthServices } from '../../lib/firebaseLoader';
import { syncService } from '../../services/syncService';
import type { AppState } from '../../types';

describe.skipIf(!emulatorsRunning)('Q1: syncService round trip (emulators)', () => {
    let uid = '';
    let email = '';

    beforeAll(async () => {
        const { auth, authApi } = await getFirebaseAuthServices();
        if (!auth) throw new Error('auth not initialized (emulator wiring broken?)');
        email = `q1-sync-${Date.now()}@example.com`;
        const cred = await authApi.createUserWithEmailAndPassword(auth, email, 'q1-password');
        uid = cred.user.uid;
    });

    it('uploadStateNow → downloadState preserves all sections', async () => {
        const state = {
            email,
            lastUpdated: Date.now(),
            program: [{ id: 'p1' }],
            activeMeso: null,
            activeSession: null,
            config: { lang: 'es' },
            exercises: [{ id: 'e1' }],
            rpFeedback: { w1: 1 },
            nutritionLogs: [{ day: 'd1' }],
            cardioSessions: [],
            bodyLogs: [{ w: 80 }],
            customFoods: [],
            personalTemplates: [],
            nutritionGoal: null,
            macroGoals: { protein: 180 },
            userProfile: { name: 'Q1' },
            logs: [{ id: 'log-9', startTime: Date.now(), exercises: [{ id: 'e1', sets: [] }] }],
        } as unknown as Partial<AppState> & { email?: string | null };

        await syncService.uploadState(uid, state);

        const snap = await syncService.downloadState(uid);
        expect(snap).not.toBeNull();
        expect(snap?.source).toBe('network');
        expect(snap?.logs).toHaveLength(1);
        expect(snap?.logs?.[0].id).toBe('log-9');
        expect(snap?.config).toMatchObject({ lang: 'es' });
        expect(snap?.macroGoals).toMatchObject({ protein: 180 });
        expect(snap?.exercises).toHaveLength(1);
        expect(snap?.nutritionLogs).toHaveLength(1);
    });
});
