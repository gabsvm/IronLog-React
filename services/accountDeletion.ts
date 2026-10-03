import { cloudSyncCache } from './cloudSyncCache';
import { dirtySyncState } from './dirtySyncState';
import { offlineSyncQueue } from './offlineSyncQueue';

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
    };
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
 * (a) re-authenticate with email+password, (b) delete
 * users/{uid}/data/history directly, then users/{uid},
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
): Promise<void> => {
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
