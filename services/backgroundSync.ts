const SYNC_TAG = 'sync-workouts';
const PERIODIC_SYNC_TAG = 'update-workouts-data';

type SyncCapableRegistration = ServiceWorkerRegistration & {
    sync?: { register: (tag: string) => Promise<void> };
    periodicSync?: { register: (tag: string, options: { minInterval: number }) => Promise<void> };
};

export const requestBackgroundSync = async () => {
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

export const requestPeriodicSync = async () => {
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

