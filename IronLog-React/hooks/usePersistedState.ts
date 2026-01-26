
import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../utils/db';

/**
 * Hook to manage state persisted in IndexedDB with write-behind (debounce) strategy.
 * Returns [state, setState, isLoading]
 */
export function usePersistedState<T>(key: string, initialValue: T, debounceMs = 1000): [T, (value: T | ((val: T) => T)) => void, boolean] {
    const [state, setState] = useState<T>(initialValue);
    const [isLoading, setIsLoading] = useState(true);
    const timeoutRef = useRef<any>(null);

    // Initial Load
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
    }, [key]); // Only run on mount or key change

    // Setter wrapper with Debounce
    const setPersistedState = useCallback((value: T | ((val: T) => T)) => {
        setState((prev) => {
            // Allow functional updates like useState
            const newValue = value instanceof Function ? value(prev) : value;
            
            // Clear pending write
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Schedule new write (Write-Behind)
            timeoutRef.current = setTimeout(() => {
                db.set(key, newValue);
            }, debounceMs);
            
            return newValue;
        });
    }, [key, debounceMs]);

    // Cleanup on unmount to ensure last write happens immediately if component unmounts?
    // In this specific hook architecture for global state, we usually rely on the timeout completing.
    // For critical data on unload, we'd need a different strategy, but for this app structure, 
    // the state lives in AppContext which rarely unmounts.

    return [state, setPersistedState, isLoading];
}
