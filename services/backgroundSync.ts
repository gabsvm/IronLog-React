const SYNC_TAG = 'sync-workouts';
const PERIODIC_SYNC_TAG = 'update-workouts-data';

type SyncCapableRegistration = ServiceWorkerRegistration & {
    sync?: { register: (tag: string) => Promise<void> };
    periodicSync?: { register: (tag: string, options: { minInterval: number }) => Promise<void> };
};

/**
 * Request background sync on a best-effort basis (Audit Decision S4-a).
 * If window clients are open when the OS fires the sync event, the SW signals
 * them to flush their pending sync queue. When the app is closed, authoritative
 * sync flushing is performed on next app launch/foregrounding via AppContext.
 */
export const requestBackgroundSync = async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) return false;

    try {
        const registration = await navigator.serviceWorker.ready as SyncCapableRegistration;
        if (!registration.sync) return false;

        await registration.sync.register(SYNC_TAG);
        return true;
    } catch (error) {
        console.warn('Background sync registration skipped:', (error as Error).message);
        return false;
    }
};

/**
 * Request periodic background sync on a best-effort basis (Audit Decision S4-a).
 * Operates as a secondary opportunity to synchronize workouts when the OS wakes
 * the browser. If no windows are active, data remains safe in IndexedDB.
 */
export const requestPeriodicSync = async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) return false;

    try {
        const registration = await navigator.serviceWorker.ready as SyncCapableRegistration;
        if (!registration.periodicSync) return false;

        await registration.periodicSync.register(PERIODIC_SYNC_TAG, {
            minInterval: 6 * 60 * 60 * 1000,
        });
        return true;
    } catch (error) {
        console.warn('Periodic sync registration skipped:', (error as Error).message);
        return false;
    }
};

