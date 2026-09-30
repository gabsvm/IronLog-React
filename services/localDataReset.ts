import { db } from '../utils/db';
import { useStore, resetStorePersistence } from '../lib/store';
import { dirtySyncState } from './dirtySyncState';

export interface ResetOptions {
    preservePreferences?: boolean; // If true, keeps lang/theme/effects preferences
}

const GAINSLAB_KEY_PREFIXES = ['il_', 'ironlog_', 'active_session'];
const PREFERENCE_KEYS = ['il_theme_v1', 'il_lang_v1', 'il_color_theme_v1', 'il_effects_mode'];

/**
 * Canonical service to perform a real, complete local data reset for GainsLab.
 * Replaces incomplete `localStorage.clear()` calls across Settings and ErrorBoundary.
 */
export const resetLocalData = async (options: ResetOptions = {}): Promise<void> => {
    try {
        // 1. Cancel pending debounce timers and reset in-memory Zustand store
        resetStorePersistence();

        // 2. Clear IndexedDB (idb-keyval store)
        await db.clear();

        // 3. Clear dirty sync state and queue
        await dirtySyncState.clear();

        // 4. Clear IndexedDB databases if databases API is available
        if (typeof window !== 'undefined' && window.indexedDB?.databases) {
            try {
                const databases = await window.indexedDB.databases();
                for (const dbInfo of databases) {
                    if (dbInfo.name && (
                        dbInfo.name.toLowerCase().includes('keyval') ||
                        dbInfo.name.toLowerCase().includes('ironlog') ||
                        dbInfo.name.toLowerCase().includes('gainslab')
                    )) {
                        window.indexedDB.deleteDatabase(dbInfo.name);
                    }
                }
            } catch (idbErr) {
                console.warn('[Reset] Error enumerating indexedDB databases:', idbErr);
            }
        }

        // 5. Clear localStorage keys
        if (typeof window !== 'undefined' && window.localStorage) {
            const preserved: Record<string, string> = {};
            if (options.preservePreferences) {
                PREFERENCE_KEYS.forEach(key => {
                    const val = window.localStorage.getItem(key);
                    if (val !== null) preserved[key] = val;
                });
            }

            const allKeys: string[] = [];
            for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i);
                if (key) allKeys.push(key);
            }

            allKeys.forEach(key => {
                const isGainsLabKey = GAINSLAB_KEY_PREFIXES.some(prefix => key.startsWith(prefix));
                if (isGainsLabKey) {
                    window.localStorage.removeItem(key);
                }
            });

            // Restore preserved preferences if requested
            if (options.preservePreferences) {
                Object.entries(preserved).forEach(([k, v]) => window.localStorage.setItem(k, v));
            }
        }

        // 6. Clear sessionStorage
        if (typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.clear();
        }

        // 7. Clear caches (CacheStorage) if available
        if (typeof window !== 'undefined' && 'caches' in window) {
            try {
                const cacheNames = await window.caches.keys();
                await Promise.all(
                    cacheNames
                        .filter(name => name.includes('gainslab') || name.includes('ironlog') || name.includes('runtime'))
                        .map(name => window.caches.delete(name))
                );
            } catch (cacheErr) {
                console.warn('[Reset] Error clearing caches:', cacheErr);
            }
        }

        // 8. Notify listeners
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('ironlog:sync-queue-changed', { detail: { pending: 0 } }));
            window.dispatchEvent(new CustomEvent('ironlog:dirty-sync-changed', { detail: { sections: [] } }));
        }
    } catch (err) {
        console.error('[Reset] Critical failure during local data reset:', err);
        // Fallback safety
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.clear();
            }
        } catch (_) {}
        throw err;
    }
};
