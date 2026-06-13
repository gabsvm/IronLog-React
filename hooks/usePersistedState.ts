
import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../utils/db';

/**
 * Hook to manage state persisted in IndexedDB with write-behind (debounce) strategy.
 * Flushes immediately on visibilitychange/pagehide to prevent data loss when the OS
 * suspends the app mid-workout (critical on mobile).
 * Returns [state, setState, isLoading]
 */
export function usePersistedState<T>(key: string, initialValue: T, debounceMs = 1000): [T, (value: T | ((val: T) => T)) => void, boolean] {
    const [state, setState] = useState<T>(initialValue);
    const [isLoading, setIsLoading] = useState(true);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingRef = useRef<{ value: T } | null>(null);

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);

        db.get<T>(key, initialValue).then((val) => {
            if (isMounted) {
                setState(val);
                setIsLoading(false);
            }
        });

        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]); // Only run on mount or key change

    const flush = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (pendingRef.current) {
            db.set(key, pendingRef.current.value);
            pendingRef.current = null;
        }
    }, [key]);

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
        setState((prev) => {
            const newValue = value instanceof Function ? value(prev) : value;

            pendingRef.current = { value: newValue };

            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                db.set(key, newValue);
                pendingRef.current = null;
            }, debounceMs);

            return newValue;
        });
    }, [key, debounceMs]);

    return [state, setPersistedState, isLoading];
}
