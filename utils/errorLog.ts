import { Capacitor } from '@capacitor/core';
import { db } from './db';
import { APP_VERSION } from '../services/backupService';
import { reportErrorRemotely } from './errorReporting';

/** Where the error was captured. */
export type ErrorSource = 'boundary' | 'window.onerror' | 'unhandledrejection' | 'chunk';

export interface ErrorEntry {
    /** Epoch ms when captured. */
    ts: number;
    /** Redacted, human-readable message. */
    message: string;
    /** Redacted stack, truncated to STACK_MAX_CHARS. */
    stack?: string;
    source: ErrorSource;
    /** App view at capture time (from history state), or 'unknown'. */
    view: string;
    appVersion: string;
    platform: 'web' | 'native';
}

export const ERROR_LOG_KEY = 'il_error_log_v1';
export const ERROR_LOG_MAX_ENTRIES = 50;
export const ERROR_LOG_STACK_MAX_CHARS = 2048;

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const SECRET_KV_RE = /(password|passwd|pwd|token|secret|api[_-]?key)\s*[:=]\s*\S+/gi;

/**
 * Strips personal data from error text: emails, passwords, tokens, API keys.
 * Training logs and input values never reach this module (callers pass only
 * error messages/stacks), and anything resembling credentials is redacted.
 */
export const redactSensitive = (text: string): string =>
    text.replace(EMAIL_RE, '[email]').replace(SECRET_KV_RE, '$1=[redacted]');

const currentView = (): string => {
    try {
        const state = window.history?.state as { view?: unknown } | null;
        return typeof state?.view === 'string' && state.view ? state.view : 'unknown';
    } catch {
        return 'unknown';
    }
};

const currentPlatform = (): 'web' | 'native' => {
    try {
        return Capacitor.isNativePlatform() ? 'native' : 'web';
    } catch {
        return 'web';
    }
};

/**
 * Appends an entry to the circular buffer (newest last, capped at 50).
 * Writes are serialized through a promise chain: concurrent logError calls
 * (e.g. an error event plus a rejection in the same tick) would otherwise
 * race the read-modify-write and lose entries.
 * Never throws: logging must not break the app, even with IndexedDB down.
 */
let writeChain: Promise<void> = Promise.resolve();

const appendEntry = async (input: {
    message: string;
    stack?: string;
    source: ErrorSource;
    view?: string;
}): Promise<void> => {
    try {
        const existing = await db.get<ErrorEntry[]>(ERROR_LOG_KEY, []);
        const entry: ErrorEntry = {
            ts: Date.now(),
            message: redactSensitive(String(input.message ?? '')).slice(0, 1024),
            source: input.source,
            view: input.view ?? currentView(),
            appVersion: APP_VERSION,
            platform: currentPlatform(),
        };
        if (input.stack) {
            entry.stack = redactSensitive(String(input.stack)).slice(0, ERROR_LOG_STACK_MAX_CHARS);
        }
        await db.set(ERROR_LOG_KEY, [...existing, entry].slice(-ERROR_LOG_MAX_ENTRIES));
        // U7: opt-in remote copy (no-op unless the user enabled it and is signed in).
        void reportErrorRemotely(entry);
    } catch {
        // Swallowed on purpose: the error log is best-effort diagnostics.
    }
};

export const logError = (input: {
    message: string;
    stack?: string;
    source: ErrorSource;
    view?: string;
}): Promise<void> => {
    writeChain = writeChain.then(() => appendEntry(input));
    return writeChain;
};

export const readErrorLog = async (): Promise<ErrorEntry[]> => {
    try {
        return await db.get<ErrorEntry[]>(ERROR_LOG_KEY, []);
    } catch {
        return [];
    }
};

export const clearErrorLog = async (): Promise<void> => {
    try {
        await db.del(ERROR_LOG_KEY);
    } catch {
        // Best-effort.
    }
};

/**
 * Builds the copy-paste diagnostics blob: app version, platform, sync state
 * (already localized by the caller) and the stored entries, newest last.
 * Entry text is already redacted at write time.
 */
export const buildDiagnosticsText = (input: {
    syncStatusText: string;
    entries: ErrorEntry[];
}): string => {
    const lines = [
        'GainsLab diagnostics',
        `App: ${APP_VERSION} | Sync: ${input.syncStatusText}`,
        `Errors: ${input.entries.length}`,
    ];
    for (const entry of input.entries.slice(-10)) {
        lines.push(
            `[${new Date(entry.ts).toISOString()}] [${entry.source}] [${entry.view}] [${entry.platform}] ${entry.message}`,
        );
        if (entry.stack) {
            for (const stackLine of entry.stack.split('\n').slice(0, 6)) {
                lines.push(`    ${stackLine.trim().slice(0, 200)}`);
            }
        }
    }
    return lines.join('\n');
};

const IGNORED_MESSAGE_RE = /ResizeObserver|Script error\./;

let listenersRegistered = false;

/**
 * Registers global capture AFTER the app mounts (called from index.tsx once
 * React is rendering). Uses addEventListener so the boot overlay assigned to
 * window.onerror in index.html keeps working untouched; the overlay only acts
 * pre-mount anyway. Returns an unsubscribe function (used by tests).
 */
export const registerGlobalErrorListeners = (): (() => void) => {
    if (listenersRegistered) return () => {};
    listenersRegistered = true;

    const onError = (event: ErrorEvent) => {
        try {
            const message = String(event.message ?? '');
            if (IGNORED_MESSAGE_RE.test(message)) return;
            const err = (event as ErrorEvent & { error?: unknown }).error;
            void logError({
                message,
                stack: err instanceof Error ? err.stack : undefined,
                source: 'window.onerror',
            });
        } catch {
            // Never break the host page from a logging listener.
        }
    };

    const onRejection = (event: Event) => {
        try {
            const reason = (event as PromiseRejectionEvent).reason;
            const message = reason instanceof Error ? reason.message : String(reason ?? 'unhandledrejection');
            if (IGNORED_MESSAGE_RE.test(message)) return;
            void logError({
                message,
                stack: reason instanceof Error ? reason.stack : undefined,
                source: 'unhandledrejection',
            });
        } catch {
            // Never break the host page from a logging listener.
        }
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
        listenersRegistered = false;
        window.removeEventListener('error', onError);
        window.removeEventListener('unhandledrejection', onRejection);
    };
};
