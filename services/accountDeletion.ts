import { cloudSyncCache } from './cloudSyncCache';
import { dirtySyncState } from './dirtySyncState';
import { offlineSyncQueue } from './offlineSyncQueue';
import { deleteAllInCollection, V2_COLLECTIONS } from './cloudV2Collections';
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
        /** Presence check for the server-side subscription doc (owner-readable). */
        getDoc?(ref: any): Promise<{ exists(): boolean }>;
        // Q21 (only used with VITE_CLOUD_LOGS_V2=1): owner listing + batched wipe of logs/.
        collection?(db: any, ...path: string[]): any;
        getDocs?(target: any): Promise<{ docs: Array<{ id: string }> }>;
        writeBatch?(db: any): { delete(ref: any): void; commit(): Promise<void> };
    };
}

/** Outcome of a cloud account deletion. `subscriptionRetained` is true when the
 * server-side subscription record (`users/{uid}/data/subscription`) existed:
 * clients can neither write nor delete it (see firestore.rules), so a backend
 * erasure flow must remove it — the app deletes everything else and reports
 * the remainder instead of claiming a complete wipe. */
export interface AccountDeletionResult {
    subscriptionRetained: boolean;
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
 * Deletes all owned cloud data before removing the Auth user. V2 collections
 * are always wiped, independent of the current sync rollout flag: a user may
 * have V2 documents from an earlier device or build.
 *
 * The server-side subscription record cannot be deleted by clients (rules deny
 * it); its pre-deletion presence is reported via `subscriptionRetained` so the
 * UI never claims a complete wipe. A backend erasure flow must remove it
 * (see docs/ACCOUNT_DELETION_SUBSCRIPTION.md).
 */
export const deleteCloudAccount = async (
    uid: string,
    email: string,
    password: string,
    firebase: AccountDeletionFirebase,
): Promise<AccountDeletionResult> => {
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

    let subscriptionRetained = false;
    try {
        const firestore = {
            db: firebase.db,
            api: firebase.firestoreApi as unknown as CloudLogsV2Firestore['api'],
        };
        for (const collection of V2_COLLECTIONS) {
            await deleteAllInCollection(collection, uid, firestore);
        }
        await firebase.firestoreApi.deleteDoc(
            firebase.firestoreApi.doc(firebase.db, 'users', uid, 'data', 'history'),
        );
        await firebase.firestoreApi.deleteDoc(firebase.firestoreApi.doc(firebase.db, 'users', uid));
        // Owner-readable: check BEFORE deleteUser removes our read access.
        if (firebase.firestoreApi.getDoc) {
            const subSnap = await firebase.firestoreApi.getDoc(
                firebase.firestoreApi.doc(firebase.db, 'users', uid, 'data', 'subscription'),
            );
            subscriptionRetained = subSnap.exists();
        }
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
    return { subscriptionRetained };
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
