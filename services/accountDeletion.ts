import { cloudSyncCache } from './cloudSyncCache';
import { dirtySyncState } from './dirtySyncState';
import { offlineSyncQueue } from './offlineSyncQueue';
import { isCloudLogsV2Enabled } from './cloudLogsV2Flag';
import type { CloudLogsV2Firestore } from './cloudLogsV2';

/** Translation-key codes for every account-deletion failure (see TRANSLATIONS.deleteAccount.errors). */
export type AccountDeletionErrorCode =
    | 'no-user'
    | 'unavailable'
    | 'offline'
    | 'wrong-password'
    | 'requires-recent-login'
    | 'partial-delete'
    | 'unknown';

export class AccountDeletionError extends Error {
    readonly code: AccountDeletionErrorCode;

    constructor(code: AccountDeletionErrorCode, cause?: unknown) {
        super(code);
        this.name = 'AccountDeletionError';
        this.code = code;
        if (cause !== undefined) {
            (this as { cause?: unknown }).cause = cause;
        }
    }
}

/**
 * Minimal structural surface of the Firebase SDK used by account deletion.
 * The real modules from firebaseLoader satisfy it; tests inject fakes.
 */
export interface AccountDeletionFirebase {
    auth: { currentUser: { uid: string; email: string | null } | null };
    authApi: {
        EmailAuthProvider: { credential(email: string, password: string): any };
        reauthenticateWithCredential(user: any, credential: any): Promise<any>;
        deleteUser(user: any): Promise<void>;
    };
    db: any;
    firestoreApi: {
        doc(db: any, ...path: string[]): any;
        deleteDoc(ref: any): Promise<void>;
        // Q21 (only used with VITE_CLOUD_LOGS_V2=1): owner listing + batched wipe of logs/.
        collection?(db: any, ...path: string[]): any;
        getDocs?(target: any): Promise<{ docs: Array<{ id: string }> }>;
        writeBatch?(db: any): { delete(ref: any): void; commit(): Promise<void> };
    };
}

export interface AccountDeletionOptions {
    /** Defaults to the VITE_CLOUD_LOGS_V2 build flag. */
    cloudLogsV2?: boolean;
}

const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

const firebaseCodeOf = (err: unknown): string | null =>
    typeof err === 'object' && err !== null && 'code' in err && typeof (err as { code: unknown }).code === 'string'
        ? (err as { code: string }).code
        : null;

const mapReauthError = (err: unknown): AccountDeletionError => {
    const code = firebaseCodeOf(err);
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        return new AccountDeletionError('wrong-password', err);
    }
    if (code === 'auth/requires-recent-login') {
        return new AccountDeletionError('requires-recent-login', err);
    }
    if (code === 'unavailable') {
        return new AccountDeletionError('offline', err);
    }
    return new AccountDeletionError('unknown', err);
};

/**
 * Deletes the cloud account in the exact safe order:
 * (a) re-authenticate with email+password, (b) with VITE_CLOUD_LOGS_V2=1
 * wipe users/{uid}/logs/* in batches, then delete users/{uid}/data/history
 * directly, then users/{uid},
 * (c) delete the Auth user.
 *
 * Q2: no collection listing. The hardened rules allow reading only
 * `data/history` by path, so getDocs(users/{uid}/data) would be DENIED; and
 * `subscription` (read-only for clients, owned by an external backend) is
 * never touched because it is never referenced.
 *
 * deleteUser is NEVER called when the Firestore wipe fails. When Auth removal
 * fails after a successful wipe, the error is `partial-delete` and re-running
 * the flow is idempotent (deleting already-deleted docs succeeds).
 */
export const deleteCloudAccount = async (
    uid: string,
    email: string,
    password: string,
    firebase: AccountDeletionFirebase,
    options: AccountDeletionOptions = {},
): Promise<void> => {
    const wipeSessionLogs = options.cloudLogsV2 ?? isCloudLogsV2Enabled();
    if (isOffline()) {
        throw new AccountDeletionError('offline');
    }

    const currentUser = firebase.auth.currentUser;
    if (!currentUser || currentUser.uid !== uid) {
        throw new AccountDeletionError('no-user');
    }

    try {
        const credential = firebase.authApi.EmailAuthProvider.credential(email, password);
        await firebase.authApi.reauthenticateWithCredential(currentUser, credential);
    } catch (err) {
        throw mapReauthError(err);
    }

    try {
        // Q21: per-session docs first (the rules allow the owner to list
        // logs/, unlike data/). Flag OFF: never touched, Q2 behavior intact.
        if (wipeSessionLogs) {
            const { deleteAllSessionLogsV2 } = await import('./cloudLogsV2');
            await deleteAllSessionLogsV2(uid, {
                db: firebase.db,
                api: firebase.firestoreApi as unknown as CloudLogsV2Firestore['api'],
            });
        }
        // Direct deletes only: history is the sole client-deletable data doc.
        await firebase.firestoreApi.deleteDoc(
            firebase.firestoreApi.doc(firebase.db, 'users', uid, 'data', 'history'),
        );
        await firebase.firestoreApi.deleteDoc(firebase.firestoreApi.doc(firebase.db, 'users', uid));
    } catch (err) {
        if (firebaseCodeOf(err) === 'unavailable') {
            throw new AccountDeletionError('offline', err);
        }
        throw new AccountDeletionError('unknown', err);
    }

    try {
        await firebase.authApi.deleteUser(currentUser);
    } catch (err) {
        if (firebaseCodeOf(err) === 'auth/requires-recent-login') {
            throw new AccountDeletionError('requires-recent-login', err);
        }
        throw new AccountDeletionError('partial-delete', err);
    }
};

/**
 * Local cleanup after a cloud deletion: empties the offline queue, the dirty
 * sections, this uid's cloud snapshot cache and the last-synced marker, so
 * nothing can re-upload deleted data. Training data on the device is left
 * alone (see resetLocalData behind the explicit wipe checkbox).
 */
export const clearAccountDeletionLocalState = async (uid: string): Promise<void> => {
    await offlineSyncQueue.clear();
    await dirtySyncState.clear();
    await cloudSyncCache.clear(uid);
    if (typeof window !== 'undefined') {
        delete (window as unknown as { _lastSyncedId?: string })._lastSyncedId;
    }
};
