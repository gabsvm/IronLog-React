
import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../utils/db';

const activeCancels = new Set<() => void>();
let suppressFlushes = false;

export const cancelAllPersistedStateFlushes = () => {
    suppressFlushes = true;
    for (const cancel of activeCancels) {
        cancel();
    }
};

export const resetPersistedStateFlushSuppression = () => {
    suppressFlushes = false;
};

/** Detail of the `ironlog:persist-error` / `ironlog:persist-ok` window events. */
export interface PersistWriteEventDetail {
    key: string;
}

export const PERSIST_ERROR_EVENT = 'ironlog:persist-error';
export const PERSIST_OK_EVENT = 'ironlog:persist-ok';
export const PERSIST_RETRY_EVENT = 'ironlog:persist-retry';

const dispatchPersistEvent = (type: string, key: string) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent<PersistWriteEventDetail>(type, { detail: { key } }));
    }
};

/**
 * Hook to manage state persisted in IndexedDB with write-behind (debounce) strategy.
 * Flushes immediately on visibilitychange/pagehide to prevent data loss when the OS
 * suspends the app mid-workout (critical on mobile).
 * Returns [state, setState, isLoading, writeError]: writeError is the timestamp of
 * the last FAILED write (null when everything is stored). A failed value stays
 * pending and is retried on the next set/flush/retry event — the UI must surface
 * writeError (see AppBanners) instead of assuming the data is safe.
 */
export function usePersistedState<T>(key: string, initialValue: T, debounceMs = 1000): [T, (value: T | ((val: T) => T)) => void, boolean, number | null] {
    const [state, setState] = useState<T>(initialValue);
    const [isLoading, setIsLoading] = useState(true);
    const [writeError, setWriteError] = useState<number | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingRef = useRef<{ value: T } | null>(null);
    const hasMutatedRef = useRef(false);

    useEffect(() => {
        const cancel = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            pendingRef.current = null;
        };
        activeCancels.add(cancel);
        return () => {
            activeCancels.delete(cancel);
        };
    }, []);

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);

        db.get<T>(key, initialValue).then((val) => {
            if (isMounted) {
                if (hasMutatedRef.current) {
                    setIsLoading(false);
                    return;
                }
                setState(val);
                setIsLoading(false);
            }
        });

        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]); // Only run on mount or key change

    /** Write through to IndexedDB. On failure the value stays pending for the
     * next retry and a global event notifies the UI (AppBanners). The key is a
     * parameter (not a dep) so the callback identity stays stable. */
    const writeThrough = useCallback((writeKey: string, value: T) => {
        void db.set(writeKey, value).then((ok) => {
            if (ok) {
                setWriteError(null);
                dispatchPersistEvent(PERSIST_OK_EVENT, writeKey);
                return;
            }
            // Keep the failed value pending (unless a newer set superseded it)
            // so the next set/flush/retry re-attempts it instead of dropping data.
            if (pendingRef.current === null) {
                pendingRef.current = { value };
            }
            setWriteError(Date.now());
            dispatchPersistEvent(PERSIST_ERROR_EVENT, writeKey);
        });
    }, []);

    const flush = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (suppressFlushes) {
            pendingRef.current = null;
            return;
        }
        if (pendingRef.current) {
            const value = pendingRef.current.value;
            pendingRef.current = null;
            writeThrough(key, value);
        }
    }, [key, writeThrough]);

    // Flush immediately when the page is hidden (tab switch, app background, close).
    // visibilitychange + pagehide are the only reliable signals on iOS/Android PWAs.
    useEffect(() => {
        const onHide = () => {
            if (document.visibilityState === 'hidden') flush();
        };
        document.addEventListener('visibilitychange', onHide);
        window.addEventListener('pagehide', flush);
        return () => {
            document.removeEventListener('visibilitychange', onHide);
            window.removeEventListener('pagehide', flush);
            flush(); // also flush on unmount (component teardown)
        };
    }, [flush]);
    const setPersistedState = useCallback((value: T | ((val: T) => T)) => {
        hasMutatedRef.current = true;
        setState((prev) => {
            const newValue = value instanceof Function ? value(prev) : value;

            if (suppressFlushes) {
                pendingRef.current = null;
                return newValue;
            }

            pendingRef.current = { value: newValue };

            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                timeoutRef.current = null;
                if (suppressFlushes) {
                    pendingRef.current = null;
                    return;
                }
                pendingRef.current = null;
                writeThrough(key, newValue);
            }, debounceMs);

            return newValue;
        });
    }, [key, debounceMs, writeThrough]);

    // Manual retry from the global write-error banner (AppBanners).
    useEffect(() => {
        const onRetry = () => flush();
        window.addEventListener(PERSIST_RETRY_EVENT, onRetry);
        return () => window.removeEventListener(PERSIST_RETRY_EVENT, onRetry);
    }, [flush]);

    return [state, setPersistedState, isLoading, writeError];
}
