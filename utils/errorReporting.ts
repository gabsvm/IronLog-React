// U7: opt-in remote error reports (OFF by default).
//
// Entries come from the local error log (utils/errorLog.ts), which already
// strips emails, passwords and tokens and truncates stacks. A report carries
// only: when, the redacted message/stack, where it was captured, the current
// view, app version and platform. No uid, email or training data.
// Sent only when the user opted in AND is signed in (Firestore rules require
// auth to create); at most REPORTS_PER_SESSION per session, never the same
// message twice. Firebase is imported lazily so the entry chunk stays small.
import type { ErrorEntry } from './errorLog';

export const ERROR_REPORTS_OPT_IN_KEY = 'il_error_reports_optin_v1';
export const REPORTS_PER_SESSION = 10;
export const ERROR_REPORTS_COLLECTION = 'errorReports';

export const isErrorReportingEnabled = (storage: Pick<Storage, 'getItem'> | undefined = safeStorage()): boolean => {
    try {
        return storage?.getItem(ERROR_REPORTS_OPT_IN_KEY) === '1';
    } catch {
        return false;
    }
};

export const setErrorReportingEnabled = (enabled: boolean, storage: Pick<Storage, 'setItem' | 'removeItem'> | undefined = safeStorage()): void => {
    try {
        if (enabled) storage?.setItem(ERROR_REPORTS_OPT_IN_KEY, '1');
        else storage?.removeItem(ERROR_REPORTS_OPT_IN_KEY);
    } catch {
        // Private mode: the preference just does not persist.
    }
};

function safeStorage(): Storage | undefined {
    try {
        return typeof window !== 'undefined' ? window.localStorage : undefined;
    } catch {
        return undefined;
    }
}

/** The exact document written to Firestore (also what the rules validate). */
export const toReportDoc = (entry: ErrorEntry): Record<string, unknown> => {
    const doc: Record<string, unknown> = {
        createdAt: entry.ts,
        message: entry.message.slice(0, 1024),
        source: entry.source,
        view: String(entry.view).slice(0, 64),
        appVersion: String(entry.appVersion).slice(0, 32),
        platform: entry.platform,
    };
    if (entry.stack) doc.stack = entry.stack.slice(0, 2048);
    return doc;
};

export interface ReportSink {
    /** Resolves false when nobody is signed in (nothing is sent). */
    send(doc: Record<string, unknown>): Promise<boolean>;
}

/** Real sink: Firestore addDoc, only with a signed-in user. Loaded on first use. */
export const firestoreReportSink: ReportSink = {
    async send(doc) {
        const { getFirebaseAuthServices, getFirebaseFirestoreServices, isFirebaseConfigured } = await import('../lib/firebaseLoader');
        if (!isFirebaseConfigured()) return false;
        const { auth } = await getFirebaseAuthServices();
        if (!auth?.currentUser) return false;
        const { db, firestoreApi } = await getFirebaseFirestoreServices();
        if (!db) return false;
        await firestoreApi.addDoc(firestoreApi.collection(db, ERROR_REPORTS_COLLECTION), doc);
        return true;
    },
};

/** Per-session limiter + dedupe; exported for tests (createReporter). */
export const createReporter = (sink: ReportSink, enabled: () => boolean = isErrorReportingEnabled) => {
    let sent = 0;
    const seen = new Set<string>();
    return async (entry: ErrorEntry): Promise<'sent' | 'skipped'> => {
        if (!enabled()) return 'skipped';
        if (sent >= REPORTS_PER_SESSION) return 'skipped';
        const key = `${entry.source}|${entry.message}`;
        if (seen.has(key)) return 'skipped';
        seen.add(key);
        try {
            const ok = await sink.send(toReportDoc(entry));
            if (!ok) {
                seen.delete(key); // not signed in: allow a later attempt
                return 'skipped';
            }
            sent += 1;
            return 'sent';
        } catch {
            return 'skipped'; // reporting must never cause more errors
        }
    };
};

/** App-wide reporter used by utils/errorLog. */
export const reportErrorRemotely = createReporter(firestoreReportSink);
