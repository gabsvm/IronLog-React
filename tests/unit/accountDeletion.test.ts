import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    AccountDeletionError,
    clearAccountDeletionLocalState,
    deleteCloudAccount,
    type AccountDeletionFirebase,
} from '../../services/accountDeletion';
import { offlineSyncQueue } from '../../services/offlineSyncQueue';
import { dirtySyncState } from '../../services/dirtySyncState';
import { cloudSyncCache } from '../../services/cloudSyncCache';
import { db } from '../../utils/db';

const makeFirebase = (overrides: {
    reauthError?: { code: string };
    deleteUserError?: { code: string };
    deleteError?: { code: string };
} = {}) => {
    const calls: string[] = [];
    const deletedRefs: string[] = [];
    const firebase: AccountDeletionFirebase = {
        auth: { currentUser: { uid: 'uid-1', email: 'a@b.c' } },
        authApi: {
            EmailAuthProvider: {
                credential: vi.fn((email: string, _password: string) => {
                    calls.push(`credential:${email}`);
                    return { email };
                }),
            },
            reauthenticateWithCredential: vi.fn(async () => {
                calls.push('reauthenticate');
                if (overrides.reauthError) throw overrides.reauthError;
            }),
            deleteUser: vi.fn(async () => {
                calls.push('deleteUser');
                if (overrides.deleteUserError) throw overrides.deleteUserError;
            }),
        },
        db: { fake: true },
        firestoreApi: {
            doc: vi.fn((_db: unknown, ...path: string[]) => {
                calls.push(`doc:${path.join('/')}`);
                return { path: path.join('/') };
            }),
            deleteDoc: vi.fn(async (ref: { path: string }) => {
                if (overrides.deleteError) throw overrides.deleteError;
                deletedRefs.push(ref.path);
                calls.push(`deleteDoc:${ref.path}`);
            }),
        },
    };
    return { firebase, calls, deletedRefs };
};

describe('N3: deleteCloudAccount removes cloud data in the exact safe order', () => {
    it('reauthenticates, deletes history directly, deletes the user doc, then the auth user (no listing, no subscription)', async () => {
        const { firebase, calls, deletedRefs } = makeFirebase();

        await deleteCloudAccount('uid-1', 'a@b.c', 'secret', firebase);

        expect(calls).toEqual([
            'credential:a@b.c',
            'reauthenticate',
            'doc:users/uid-1/data/history',
            'deleteDoc:users/uid-1/data/history',
            'doc:users/uid-1',
            'deleteDoc:users/uid-1',
            'deleteUser',
        ]);
        expect(deletedRefs).toEqual(['users/uid-1/data/history', 'users/uid-1']);
        // Q2: subscription is untouched because it is never referenced.
        expect(calls.join('|')).not.toContain('subscription');
    });

    it('never calls deleteUser when the Firestore wipe fails', async () => {
        const { firebase } = makeFirebase({ deleteError: { code: 'unavailable' } });

        await expect(deleteCloudAccount('uid-1', 'a@b.c', 'secret', firebase)).rejects.toMatchObject({
            code: 'offline',
        });
        expect(firebase.authApi.deleteUser).not.toHaveBeenCalled();
    });

    it('wrong password deletes nothing', async () => {
        const { firebase, calls } = makeFirebase({ reauthError: { code: 'auth/wrong-password' } });

        await expect(deleteCloudAccount('uid-1', 'a@b.c', 'wrong', firebase)).rejects.toMatchObject({
            code: 'wrong-password',
        });
        expect(calls).toEqual(['credential:a@b.c', 'reauthenticate']);
        expect(firebase.authApi.deleteUser).not.toHaveBeenCalled();
        expect(firebase.firestoreApi.deleteDoc).not.toHaveBeenCalled();
    });

    it('maps invalid-credential to wrong-password and surfaces requires-recent-login', async () => {
        const invalid = makeFirebase({ reauthError: { code: 'auth/invalid-credential' } });
        await expect(deleteCloudAccount('uid-1', 'a@b.c', 'x', invalid.firebase)).rejects.toMatchObject({
            code: 'wrong-password',
        });

        const stale = makeFirebase({ reauthError: { code: 'auth/requires-recent-login' } });
        await expect(deleteCloudAccount('uid-1', 'a@b.c', 'x', stale.firebase)).rejects.toMatchObject({
            code: 'requires-recent-login',
        });
        expect(stale.firebase.authApi.deleteUser).not.toHaveBeenCalled();
    });

    it('reports a partial delete when Auth removal fails after the data wipe (retry stays idempotent)', async () => {
        const { firebase, calls } = makeFirebase({ deleteUserError: { code: 'auth/internal-error' } });

        await expect(deleteCloudAccount('uid-1', 'a@b.c', 'secret', firebase)).rejects.toMatchObject({
            code: 'partial-delete',
        });
        // Data wipe completed before the Auth failure.
        expect(calls).toContain('deleteDoc:users/uid-1');
    });

    it('refuses to start while offline without touching Firebase', async () => {
        const { firebase, calls } = makeFirebase();
        const onLine = window.navigator.onLine;
        Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
        try {
            await expect(deleteCloudAccount('uid-1', 'a@b.c', 'secret', firebase)).rejects.toMatchObject({
                code: 'offline',
            });
        } finally {
            Object.defineProperty(window.navigator, 'onLine', { value: onLine, configurable: true });
        }
        expect(calls).toEqual([]);
    });

    it('rejects when there is no signed-in user', async () => {
        const { firebase } = makeFirebase();
        firebase.auth.currentUser = null;
        await expect(deleteCloudAccount('uid-1', 'a@b.c', 'secret', firebase)).rejects.toMatchObject({
            code: 'no-user',
        });
    });
});

describe('N3: clearAccountDeletionLocalState leaves nothing that could re-upload', () => {
    beforeEach(async () => {
        await db.clear();
    });

    it('empties the offline queue, dirty state, cloud cache and last-synced marker', async () => {
        await offlineSyncQueue.enqueueStateSnapshot('uid-1', { logs: [] } as never, ['logs']);
        await dirtySyncState.mark(['logs']);
        await cloudSyncCache.write('uid-1', { sections: ['logs'] } as never);
        (window as never as { _lastSyncedId?: string })._lastSyncedId = 'uid-1';
        expect(await offlineSyncQueue.count()).toBe(1);

        await clearAccountDeletionLocalState('uid-1');

        expect(await offlineSyncQueue.count()).toBe(0);
        expect(await offlineSyncQueue.list()).toEqual([]);
        expect(await dirtySyncState.list()).toEqual([]);
        expect(await cloudSyncCache.read('uid-1')).toBeNull();
        expect((window as { _lastSyncedId?: string })._lastSyncedId).toBeUndefined();
    });
});

describe('N3: AccountDeletionError carries a translation key code', () => {
    it('exposes the code and keeps the cause', () => {
        const cause = new Error('boom');
        const err = new AccountDeletionError('partial-delete', cause);
        expect(err).toBeInstanceOf(Error);
        expect(err.code).toBe('partial-delete');
        expect(err.cause).toBe(cause);
    });
});

describe('Q21: deleteCloudAccount wipes per-session logs when V2 is on', () => {
    const withLogsApi = (ids: string[], opts: { commitError?: { code: string } } = {}) => {
        const made = makeFirebase();
        const api = made.firebase.firestoreApi;
        api.collection = vi.fn((_db: unknown, ...path: string[]) => ({ path: path.join('/') }));
        api.getDocs = vi.fn(async (target: { path: string }) => {
            made.calls.push(`getDocs:${target.path}`);
            return { docs: ids.map((id) => ({ id })) };
        });
        api.writeBatch = vi.fn(() => {
            const pending: string[] = [];
            return {
                delete: (ref: { path: string }) => pending.push(ref.path),
                commit: async () => {
                    if (opts.commitError) throw opts.commitError;
                    made.calls.push(`batchDelete:${pending.length}`);
                },
            };
        });
        return made;
    };

    it('lists and batch-deletes logs/ and the S5 section collections before history and the user doc', async () => {
        const { firebase, calls } = withLogsApi(['1', '2', '3']);
        await deleteCloudAccount('uid-1', 'a@b.c', 'secret', firebase, { cloudLogsV2: true });
        const order = calls.filter((c) => /^(getDocs|batchDelete|deleteDoc|deleteUser)/.test(c));
        expect(order).toEqual([
            'getDocs:users/uid-1/logs',
            'batchDelete:3',
            'getDocs:users/uid-1/nutritionEntries',
            'batchDelete:3',
            'getDocs:users/uid-1/nutritionDays',
            'batchDelete:3',
            'getDocs:users/uid-1/bodyLogs',
            'batchDelete:3',
            'getDocs:users/uid-1/cardioSessions',
            'batchDelete:3',
            'getDocs:users/uid-1/customFoods',
            'batchDelete:3',
            'deleteDoc:users/uid-1/data/history',
            'deleteDoc:users/uid-1',
            'deleteUser',
        ]);
    });

    it('a failed logs wipe never deletes the auth user', async () => {
        const { firebase, calls } = withLogsApi(['1'], { commitError: { code: 'permission-denied' } });
        await expect(
            deleteCloudAccount('uid-1', 'a@b.c', 'secret', firebase, { cloudLogsV2: true }),
        ).rejects.toMatchObject({ code: 'unknown' });
        expect(calls).not.toContain('deleteUser');
        expect(calls.some((c) => c.startsWith('deleteDoc:'))).toBe(false);
    });

    it('flag off (default) never lists logs/', async () => {
        const { firebase, calls } = withLogsApi(['1']);
        await deleteCloudAccount('uid-1', 'a@b.c', 'secret', firebase);
        expect(calls.some((c) => c.startsWith('getDocs'))).toBe(false);
    });
});
