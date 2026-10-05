// U7: the real Firestore sink against the emulators and the real rules.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, getDocs } from 'firebase/firestore';
import { emulatorsRunning } from './setup';
import { getFirebaseAuthServices } from '../../lib/firebaseLoader';
import { firestoreReportSink, toReportDoc } from '../../utils/errorReporting';

describe.skipIf(!emulatorsRunning)('U7: error reports sink (emulators, real rules)', () => {
    it('signed in: the report is stored; signed out: nothing is sent', async () => {
        const { auth, authApi } = await getFirebaseAuthServices();
        if (!auth) throw new Error('auth not initialized');
        const doc = toReportDoc({
            ts: Date.now(), message: `TypeError: u7-${Date.now()}`, source: 'boundary', view: 'stats', appVersion: '4.0.3', platform: 'web',
        });

        await authApi.signOut(auth);
        expect(await firestoreReportSink.send(doc)).toBe(false);

        await authApi.createUserWithEmailAndPassword(auth, `u7-${Date.now()}@example.com`, 'u7-password');
        expect(await firestoreReportSink.send(doc)).toBe(true);

        const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8085').split(':');
        const env = await initializeTestEnvironment({
            projectId: 'demo-q1-integration',
            firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host, port: Number(port) },
        });
        try {
            await env.withSecurityRulesDisabled(async (ctx) => {
                const snap = await getDocs(collection(ctx.firestore(), 'errorReports'));
                const stored = snap.docs.map((d) => d.data()).find((d) => d.message === doc.message);
                expect(stored).toEqual(doc);
            });
        } finally {
            await env.cleanup();
        }
    });
});
