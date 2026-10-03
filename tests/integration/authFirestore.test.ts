// Q1: register a user against the Auth emulator, then write/read
// users/{uid} + data/history under the REAL firestore.rules.
import { describe, it, expect, beforeAll } from 'vitest';
import { emulatorsRunning } from './setup';
import { getFirebaseAuthServices, getFirebaseFirestoreServices } from '../../lib/firebaseLoader';

describe.skipIf(!emulatorsRunning)('Q1: Auth emulator + real Firestore rules', () => {
    let uid = '';

    beforeAll(async () => {
        const { auth, authApi } = await getFirebaseAuthServices();
        if (!auth) throw new Error('auth not initialized (emulator wiring broken?)');
        const email = `q1-${Date.now()}@example.com`;
        const cred = await authApi.createUserWithEmailAndPassword(auth, email, 'q1-password');
        uid = cred.user.uid;
        expect(uid.length).toBeGreaterThan(0);
    });

    it('registers via the Auth emulator and signs in', async () => {
        const { auth } = await getFirebaseAuthServices();
        expect(auth?.currentUser?.uid).toBe(uid);
    });

    it('owner writes and reads users/{uid} under the real rules', async () => {
        const { db, firestoreApi } = await getFirebaseFirestoreServices();
        if (!db) throw new Error('firestore not initialized (emulator wiring broken?)');
        const ref = firestoreApi.doc(db, 'users', uid);
        await firestoreApi.setDoc(
            ref,
            { email: 'q1@example.com', lastSeen: Date.now(), uid },
            { merge: true },
        );
        const snap = await firestoreApi.getDoc(ref);
        expect(snap.exists()).toBe(true);
        expect(snap.data()?.uid).toBe(uid);
    });

    it('owner writes and reads data/history under the real rules', async () => {
        const { db, firestoreApi } = await getFirebaseFirestoreServices();
        if (!db) throw new Error('firestore not initialized');
        const ref = firestoreApi.doc(db, 'users', uid, 'data', 'history');
        const logs = [{ id: 'log-1', startTime: Date.now(), exercises: [] }];
        await firestoreApi.setDoc(ref, { logs });
        const snap = await firestoreApi.getDoc(ref);
        expect(snap.exists()).toBe(true);
        expect(snap.data()?.logs).toHaveLength(1);
    });

    it('another user cannot read the first user doc (real rules deny)', async () => {
        const { auth, authApi } = await getFirebaseAuthServices();
        const { db, firestoreApi } = await getFirebaseFirestoreServices();
        if (!auth || !db) throw new Error('firebase not initialized');
        await authApi.signOut(auth);
        const cred = await authApi.createUserWithEmailAndPassword(
            auth,
            `q1-other-${Date.now()}@example.com`,
            'q1-password',
        );
        expect(cred.user.uid).not.toBe(uid);
        const ref = firestoreApi.doc(db, 'users', uid);
        await expect(firestoreApi.getDoc(ref)).rejects.toThrow();
    });
});
