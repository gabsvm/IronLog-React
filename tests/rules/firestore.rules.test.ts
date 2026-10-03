import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment,
    type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    writeBatch,
} from 'firebase/firestore';
import { buildSectionSyncMeta, serializeMeso } from '../../services/syncHelpers';
import type { DirtySyncSection } from '../../types';

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
const PROJECT_ID = 'demo-n4-rules';

const parseEmulatorHost = (): { host: string; port: number } => {
    const fallback = { host: '127.0.0.1', port: 8080 };
    if (!EMULATOR_HOST) return fallback;
    const [host, port] = EMULATOR_HOST.split(':');
    return { host: host || fallback.host, port: Number(port) || fallback.port };
};

// Skipped (documented as unverified) when the Firestore emulator is not
// running; `npm run test:rules` starts it via emulators:exec.
describe.skipIf(!EMULATOR_HOST)('N4: hardened Firestore rules (emulator)', () => {
    let testEnv: RulesTestEnvironment;

    const alice = () => testEnv.authenticatedContext('alice', { email: 'alice@example.com', email_verified: true });
    const bob = () => testEnv.authenticatedContext('bob', { email: 'bob@example.com', email_verified: true });
    const anon = () => testEnv.unauthenticatedContext();
    const adminClaim = () =>
        testEnv.authenticatedContext('owner', { email: 'owner@example.com', email_verified: true, admin: true });
    const adminEmail = () =>
        testEnv.authenticatedContext('owner2', { email: 'gabsvm@gmail.com', email_verified: true });
    const adminEmailUnverified = () =>
        testEnv.authenticatedContext('owner3', { email: 'gabsvm@gmail.com', email_verified: false });

    beforeAll(async () => {
        const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');
        const { host, port } = parseEmulatorHost();
        testEnv = await initializeTestEnvironment({
            projectId: PROJECT_ID,
            firestore: { rules, host, port },
        });
    });

    afterAll(async () => {
        await testEnv?.cleanup();
    });

    beforeEach(async () => {
        await testEnv.clearFirestore();
    });

    it('owner reads and writes their own doc with real keys (identity + session payloads)', async () => {
        const db = alice().firestore();
        const ref = doc(db, 'users/alice');
        await assertSucceeds(setDoc(ref, { email: 'alice@example.com', lastSeen: 1, uid: 'alice' }, { merge: true }));
        await assertSucceeds(updateDoc(ref, { activeSession: null, lastUpdated: 2 }));
        await assertSucceeds(getDoc(ref));
    });

    it('rejects unknown keys and mistyped values on the user doc', async () => {
        const db = alice().firestore();
        const ref = doc(db, 'users/alice');
        await assertFails(setDoc(ref, { evil: 1 }, { merge: true }));
        await assertFails(setDoc(ref, { lastUpdated: 'now' }, { merge: true }));
        await assertFails(setDoc(ref, { config: [1, 2] }, { merge: true }));
    });

    it('enforces the 2x array caps from syncService trims', async () => {
        const db = alice().firestore();
        const ref = doc(db, 'users/alice');
        await assertSucceeds(setDoc(ref, { nutritionLogs: new Array(120).fill(1) }, { merge: true }));
        await assertFails(setDoc(ref, { nutritionLogs: new Array(121).fill(1) }, { merge: true }));
        await assertSucceeds(setDoc(ref, { bodyLogs: new Array(200).fill(1) }, { merge: true }));
        await assertFails(setDoc(ref, { bodyLogs: new Array(201).fill(1) }, { merge: true }));
    });

    it('denies other users and unauthenticated clients on user docs', async () => {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), 'users/alice'), { email: 'alice@example.com' });
        });
        const bobDb = bob().firestore();
        await assertFails(getDoc(doc(bobDb, 'users/alice')));
        await assertFails(setDoc(doc(bobDb, 'users/alice'), { email: 'x' }, { merge: true }));
        await assertFails(deleteDoc(doc(bobDb, 'users/alice')));
        const anonDb = anon().firestore();
        await assertFails(getDoc(doc(anonDb, 'users/alice')));
        await assertFails(setDoc(doc(anonDb, 'users/alice'), { email: 'x' }, { merge: true }));
    });

    it('allows data/history with a logs list, denies any other data doc name', async () => {
        const db = alice().firestore();
        await assertSucceeds(setDoc(doc(db, 'users/alice/data/history'), { logs: [{ id: 1 }] }));
        await assertSucceeds(getDoc(doc(db, 'users/alice/data/history')));
        await assertFails(setDoc(doc(db, 'users/alice/data/other'), { x: 1 }));
        await assertFails(deleteDoc(doc(db, 'users/alice/data/other')));
        await assertFails(setDoc(doc(db, 'users/alice/data/history'), { logs: 'nope' }));
        await assertFails(setDoc(doc(db, 'users/alice/data/history'), { logs: [], extra: 1 }));
    });

    it('keeps subscription read-only for the client (read ok, write/delete denied)', async () => {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), 'users/alice/data/subscription'), { isPro: true });
        });
        const db = alice().firestore();
        await assertSucceeds(getDoc(doc(db, 'users/alice/data/subscription')));
        await assertFails(setDoc(doc(db, 'users/alice/data/subscription'), { isPro: false }, { merge: true }));
        await assertFails(deleteDoc(doc(db, 'users/alice/data/subscription')));
        // Even the admin claim cannot write it from a client.
        const adminDb = adminClaim().firestore();
        await assertFails(setDoc(doc(adminDb, 'users/alice/data/subscription'), { isPro: false }, { merge: true }));
    });

    it('lets admins write globals while everyone reads them', async () => {
        const adminDb = adminClaim().firestore();
        await assertSucceeds(setDoc(doc(adminDb, 'global_templates/t1'), { name: 't' }));
        await assertSucceeds(deleteDoc(doc(adminDb, 'global_templates/t1')));
        await assertSucceeds(setDoc(doc(adminDb, 'global_exercises/e1'), { name: 'e' }));
        await assertSucceeds(setDoc(doc(adminEmail().firestore(), 'global_templates/t9'), { name: 't' }));

        const userDb = alice().firestore();
        await assertFails(setDoc(doc(userDb, 'global_templates/t2'), { name: 't' }));
        await assertFails(setDoc(doc(userDb, 'global_exercises/e2'), { name: 'e' }));
        await assertSucceeds(getDocs(collection(userDb, 'global_templates')));
        await assertSucceeds(getDocs(collection(anon().firestore(), 'global_exercises')));
    });

    it('denies the admin email without verification and without the claim', async () => {
        const db = adminEmailUnverified().firestore();
        await assertFails(setDoc(doc(db, 'global_templates/t3'), { name: 't' }));
        await assertFails(setDoc(doc(db, 'global_exercises/e3'), { name: 'e' }));
    });

    it('lets the owner delete their user doc and history (N3 compatibility)', async () => {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            const sdb = ctx.firestore();
            await setDoc(doc(sdb, 'users/alice'), { email: 'alice@example.com' });
            await setDoc(doc(sdb, 'users/alice/data/history'), { logs: [] });
        });
        const db = alice().firestore();
        await assertSucceeds(deleteDoc(doc(db, 'users/alice/data/history')));
        await assertSucceeds(deleteDoc(doc(db, 'users/alice')));
    });

    it('accepts a full uploadStateNow payload with every section', async () => {
        const db = alice().firestore();
        const lastUpdated = Date.now();
        const sections: DirtySyncSection[] = [
            'program', 'activeMeso', 'exercises', 'logs', 'config', 'rpFeedback',
            'userProfile', 'nutritionLogs', 'cardioSessions', 'nutritionGoal',
            'bodyLogs', 'macroGoals', 'customFoods', 'personalTemplates',
        ];
        // Same shape uploadStateNow builds: real serializeMeso +
        // buildSectionSyncMeta, real trims, merge set + history set in one batch.
        const payload = {
            lastUpdated,
            email: 'alice@example.com',
            program: [{ day: 1 }],
            activeMeso: serializeMeso({ id: 1, week: 2, plan: [[{ ex: 1 }]] }),
            activeSession: null,
            config: { showRIR: true },
            exercises: [{ id: 'e1' }],
            rpFeedback: {},
            nutritionLogs: new Array(60).fill({ food: 'x' }),
            cardioSessions: new Array(60).fill({ kind: 'run' }),
            bodyLogs: new Array(100).fill({ w: 80 }),
            customFoods: new Array(100).fill({ name: 'y' }),
            personalTemplates: [],
            nutritionGoal: null,
            macroGoals: { protein: 180 },
            userProfile: { bodyWeight: 80 },
            sectionSyncMeta: buildSectionSyncMeta(sections, lastUpdated),
        };
        const batch = writeBatch(db);
        batch.set(doc(db, 'users/alice'), JSON.parse(JSON.stringify(payload)), { merge: true });
        batch.set(doc(db, 'users/alice/data/history'), { logs: [{ id: 1 }] });
        await assertSucceeds(batch.commit());
    });

    it('denies unmatched paths explicitly', async () => {
        const db = alice().firestore();
        await assertFails(setDoc(doc(db, 'whatever/x'), { a: 1 }));
        await assertFails(getDoc(doc(db, 'whatever/x')));
    });
});
