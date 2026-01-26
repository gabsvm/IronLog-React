
import { get, set, del } from 'idb-keyval';

/**
 * Storage utility that prefers IndexedDB via idb-keyval.
 * Includes automatic migration from localStorage if the key exists there but not in DB.
 */
export const db = {
    get: async <T>(key: string, defaultValue: T): Promise<T> => {
        try {
            // 1. Try to get from IndexedDB
            const val = await get<T>(key);
            if (val !== undefined) {
                return val;
            }

            // 2. Migration: If not in IDB, check LocalStorage
            const lsItem = window.localStorage.getItem(key);
            if (lsItem !== null) {
                try {
                    const parsed = JSON.parse(lsItem);
                    // 3. Save to IDB for next time
                    await set(key, parsed);
                    // 4. Remove from LS to complete migration (optional, keeps LS clean)
                    window.localStorage.removeItem(key);
                    console.log(`Migrated ${key} from LocalStorage to IndexedDB`);
                    return parsed;
                } catch (e) {
                    console.error("Migration parse error", e);
                }
            }

            // 5. Return default if nothing found
            return defaultValue;
        } catch (err) {
            console.error(`DB Get Error (${key}):`, err);
            return defaultValue;
        }
    },

    set: async <T>(key: string, value: T): Promise<void> => {
        try {
            await set(key, value);
        } catch (err) {
            console.error(`DB Set Error (${key}):`, err);
        }
    },

    del: async (key: string): Promise<void> => {
        await del(key);
    }
};
