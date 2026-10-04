// Q2: real deleteCloudAccount flow against Auth + Firestore emulators,
// under the REAL firestore.rules. Subscription is seeded/read through the
// rules-disabled admin context (clients can never write it).
import { readFileSync } from 'node:fs';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
    initializeTestEnvironment,
    type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { emulatorsRunning } from './setup';
import {
    getFirebaseAuthServices,
    getFirebaseFirestoreServices,
} from '../../lib/firebaseLoader';
import { deleteCloudAccount } from '../../services/accountDeletion';

const PROJECT_ID = 'demo-q1-integration';

const parseHost = (value: string | undefined, fallbackPort: number) => {
    const [host, port] = (value ?? '').split(':');
    return { host: host || '127.0.0.1', port: Number(port) || fallbackPort };
};

describe.skipIf(!emulatorsRunning)('Q2: deleteCloudAccount end to end (emulators)', () => {
    let testEnv: RulesTestEnvironment;

    beforeAll(async () => {
        const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');
        const { host, port } = parseHost(process.env.FIRESTORE_EMULATOR_HOST, 8085);
        testEnv = await initializeTestEnvironment({
            projectId: PROJECT_ID,
            firestore: { rules, host, port },
        });
    });

    afterAll(async () => {
        await testEnv?.cleanup();
    });

    const adminSnap = async (path: string) => {
        let snap: Awaited<ReturnType<typeof getDoc>> | null = null;
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            snap = await getDoc(doc(ctx.firestore(), path));
        });
        return snap!;
    };

    const registerWithData = async (tag: string) => {
        const { auth, authApi } = await getFirebaseAuthServices();
        const { db, firestoreApi } = await getFirebaseFirestoreServices();
        if (!auth || !db) throw new Error('firebase not initialized');
        const email = `q2-${tag}-${Date.now()}@example.com`;
        const password = 'q2-password';
        const cred = await authApi.createUserWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;
        await firestoreApi.setDoc(firestoreApi.doc(db, 'users', uid), {
            email,
            lastSeen: Date.now(),
            uid,
        });
        await firestoreApi.setDoc(firestoreApi.doc(db, 'users', uid, 'data', 'history'), {
            logs: [{ id: 'log-1' }],
        });
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), `users/${uid}/data/subscription`), { isPro: true });
        });
        return { auth, authApi, db, firestoreApi, uid, email, password };
    };

    it('deletes user doc + history + auth user, keeps subscription', async () => {
        const { auth, authApi, db, firestoreApi, uid, email, password } =
            await registerWithData('full');

        await deleteCloudAccount(uid, email, password, { auth, authApi, db, firestoreApi });

        expect((await adminSnap(`users/${uid}`)).exists()).toBe(false);
        expect((await adminSnap(`users/${uid}/data/history`)).exists()).toBe(false);
        const sub = await adminSnap(`users/${uid}/data/subscription`);
        expect(sub.exists()).toBe(true);
        expect((sub.data() as { isPro?: boolean } | undefined)?.isPro).toBe(true);
        expect(auth.currentUser).toBeNull();
    });

    it('wrong password deletes nothing', async () => {
        const { auth, authApi, db, firestoreApi, uid, email } = await registerWithData('wrongpw');

        await expect(
            deleteCloudAccount(uid, email, 'not-the-password', { auth, authApi, db, firestoreApi }),
        ).rejects.toMatchObject({ code: 'wrong-password' });

        expect((await adminSnap(`users/${uid}`)).exists()).toBe(true);
        expect((await adminSnap(`users/${uid}/data/history`)).exists()).toBe(true);
        expect(auth.currentUser?.uid).toBe(uid);
    });

    it('retry after a partial wipe is idempotent (missing docs delete fine)', async () => {
        const { auth, authApi, db, firestoreApi, uid, email, password } =
            await registerWithData('retry');
        // Simulate a first attempt that wiped Firestore then failed on Auth.
        await deleteDoc(firestoreApi.doc(db, 'users', uid, 'data', 'history'));
        await deleteDoc(firestoreApi.doc(db, 'users', uid));

        await deleteCloudAccount(uid, email, password, { auth, authApi, db, firestoreApi });

        expect((await adminSnap(`users/${uid}`)).exists()).toBe(false);
        expect(auth.currentUser).toBeNull();
    });

    it('Q21: with V2 on, wipes users/{uid}/logs/* too (owner listing allowed by rules)', async () => {
        const { auth, authApi, db, firestoreApi, uid, email, password } =
            await registerWithData('logs');
        for (const id of [1, 2, 3]) {
            await firestoreApi.setDoc(firestoreApi.doc(db, 'users', uid, 'logs', String(id)), {
                id,
                name: `s${id}`,
                exercises: [],
                updatedAt: 1000 + id,
            });
        }
        await firestoreApi.setDoc(firestoreApi.doc(db, 'users', uid, 'logs', '4'), {
            id: 4,
            updatedAt: 2000,
            deleted: true,
        });

        await deleteCloudAccount(uid, email, password, { auth, authApi, db, firestoreApi }, { cloudLogsV2: true });

        for (const id of ['1', '2', '3', '4']) {
            expect((await adminSnap(`users/${uid}/logs/${id}`)).exists()).toBe(false);
        }
        expect((await adminSnap(`users/${uid}`)).exists()).toBe(false);
        expect((await adminSnap(`users/${uid}/data/subscription`)).exists()).toBe(true);
        expect(auth.currentUser).toBeNull();
    });
});
