// S5: nutrition / body / cardio / food collections (V2) through the REAL
// syncService against the Auth + Firestore emulators and the REAL rules.
import { describe, it, expect, vi } from 'vitest';
import { emulatorsRunning } from './setup';
import {
    getFirebaseAuthServices,
    getFirebaseFirestoreServices,
} from '../../lib/firebaseLoader';
import { syncService } from '../../services/syncService';
import { deleteCloudAccount } from '../../services/accountDeletion';
import type { AppState } from '../../types';

const flag = vi.hoisted(() => ({ on: false }));
vi.mock('../../services/cloudLogsV2Flag', () => ({
    isCloudLogsV2Enabled: () => flag.on,
}));

const DAY = 86_400_000;
const BASE = Date.UTC(2026, 0, 1);
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

const history = () => ({
    // Appended (oldest first), 80 days.
    nutritionLogs: Array.from({ length: 80 }, (_, i) => ({
        date: isoDay(BASE + i * DAY),
        entries: [{ id: `m${i}`, name: 'Comida', calories: 600, protein: 40, carbs: 60, fat: 15, mealType: 'lunch', timestamp: BASE + i * DAY }],
        waterMl: 1000,
    })),
    // Prepended (newest first), as the app stores them.
    bodyLogs: Array.from({ length: 130 }, (_, i) => ({ id: BASE + (129 - i) * DAY, date: BASE + (129 - i) * DAY, weight: 80 - i * 0.01 })),
    cardioSessions: Array.from({ length: 70 }, (_, i) => ({
        id: `cardio_${69 - i}`, date: isoDay(BASE + (69 - i) * DAY), activityType: 'running', durationMin: 30, timestamp: BASE + (69 - i) * DAY,
    })),
    customFoods: Array.from({ length: 110 }, (_, i) => ({
        id: `cf_${109 - i}`, name: `Alimento ${109 - i}`, calories: 100, protein: 5, carbs: 10, fat: 2, createdAt: BASE + (109 - i) * 1000,
    })),
});

const SECTIONS = ['nutritionLogs', 'bodyLogs', 'cardioSessions', 'customFoods'] as const;
const V2_SECTION_COLLECTIONS = ['nutritionEntries', 'nutritionDays', 'bodyLogs', 'cardioSessions', 'customFoods'];

const register = async (tag: string) => {
    const { auth, authApi } = await getFirebaseAuthServices();
    const { db, firestoreApi } = await getFirebaseFirestoreServices();
    if (!auth || !db) throw new Error('firebase not initialized (emulator wiring broken?)');
    const email = `s5-${tag}-${Date.now()}@example.com`;
    const password = 's5-password';
    const cred = await authApi.createUserWithEmailAndPassword(auth, email, password);
    return { auth, authApi, db, firestoreApi, uid: cred.user.uid, email, password };
};

const stateWith = (email: string, data: ReturnType<typeof history>) =>
    ({ email, lastUpdated: Date.now(), ...data }) as unknown as Partial<AppState> & { email?: string | null };

describe.skipIf(!emulatorsRunning)('S5: section collections V2 (emulators, real rules)', () => {
    it('flag ON: the full history round-trips; the main doc keeps the newest capped slice', async () => {
        const { uid, email, db, firestoreApi } = await register('full');
        const data = history();
        flag.on = true;
        try {
            await syncService.uploadState(uid, stateWith(email, data), [...SECTIONS]);

            // U6: nutrition is one doc per meal (80 days x 1 meal) + one per day.
            const sizes: Record<string, number> = {
                nutritionEntries: data.nutritionLogs.reduce((n, d) => n + d.entries.length, 0),
                nutritionDays: data.nutritionLogs.length,
                bodyLogs: data.bodyLogs.length,
                cardioSessions: data.cardioSessions.length,
                customFoods: data.customFoods.length,
            };
            for (const [collection, size] of Object.entries(sizes)) {
                const snap = await firestoreApi.getDocs(firestoreApi.collection(db, 'users', uid, collection));
                expect(snap.size, collection).toBe(size);
            }
            const user = (await firestoreApi.getDoc(firestoreApi.doc(db, 'users', uid))).data() as Record<string, any>;
            expect(user.collectionsFormat).toEqual({ nutritionEntries: 2, nutritionDays: 2, bodyLogs: 2, cardioSessions: 2, customFoods: 2 });
            // Legacy copy: capped, but the NEWEST items (S5 cap fix).
            expect(user.bodyLogs).toHaveLength(100);
            expect(user.bodyLogs[0].date).toBe(data.bodyLogs[0].date);

            const downloaded = await syncService.downloadState(uid);
            expect(downloaded?.source).toBe('network');
            expect(downloaded?.nutritionLogs).toHaveLength(80);
            expect(downloaded?.bodyLogs).toHaveLength(130);
            expect(downloaded?.cardioSessions).toHaveLength(70);
            expect(downloaded?.customFoods).toHaveLength(110);
            // App order preserved: nutrition oldest-first, the rest newest-first.
            expect(downloaded?.nutritionLogs?.[0].date).toBe(data.nutritionLogs[0].date);
            expect(downloaded?.bodyLogs?.[0].id).toBe(data.bodyLogs[0].id);
        } finally {
            flag.on = false;
        }
    });

    it('flag OFF (golden path): no collections, capped arrays keep the newest weigh-in', async () => {
        const { uid, email, db, firestoreApi } = await register('off');
        const data = history();
        flag.on = false;
        await syncService.uploadState(uid, stateWith(email, data), [...SECTIONS]);
        const user = (await firestoreApi.getDoc(firestoreApi.doc(db, 'users', uid))).data() as Record<string, any>;
        expect(user.nutritionLogs).toHaveLength(60);
        expect(user.nutritionLogs[59].date).toBe(data.nutritionLogs[79].date);
        expect(user.bodyLogs[0].id).toBe(data.bodyLogs[0].id);
        expect(user.cardioSessions[0].id).toBe('cardio_69');
        expect(user.customFoods[0].id).toBe('cf_109');
        expect(user).not.toHaveProperty('collectionsFormat');
        for (const collection of V2_SECTION_COLLECTIONS) {
            const snap = await firestoreApi.getDocs(firestoreApi.collection(db, 'users', uid, collection));
            expect(snap.size, collection).toBe(0);
        }
    });

    it('account deletion with V2 on wipes every section collection', async () => {
        const { auth, authApi, db, firestoreApi, uid, email, password } = await register('delete');
        flag.on = true;
        try {
            await syncService.uploadState(uid, stateWith(email, history()), [...SECTIONS]);
            await deleteCloudAccount(uid, email, password, { auth, authApi, db, firestoreApi });
        } finally {
            flag.on = false;
        }
        expect(auth.currentUser).toBeNull();
        // The client is signed out now: inspect through a rules-disabled context.
        const { initializeTestEnvironment } = await import('@firebase/rules-unit-testing');
        const { readFileSync } = await import('node:fs');
        const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8085').split(':');
        const env = await initializeTestEnvironment({
            projectId: 'demo-q1-integration',
            firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host, port: Number(port) },
        });
        try {
            await env.withSecurityRulesDisabled(async (ctx) => {
                const admin = ctx.firestore();
                const { collection: col, getDocs: list, doc: ref, getDoc: get } = await import('firebase/firestore');
                for (const collection of V2_SECTION_COLLECTIONS) {
                    expect((await list(col(admin, 'users', uid, collection))).size, collection).toBe(0);
                }
                expect((await get(ref(admin, 'users', uid))).exists()).toBe(false);
            });
        } finally {
            await env.cleanup();
        }
    });
});
