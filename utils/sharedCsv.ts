// S3: CSV files that reach the PWA from outside the app.
// - Android/ChromeOS share sheet → manifest share_target → public/sw.js stores
//   the file in the 'gainslab-share-v1' cache and redirects to ?action=import-csv.
// - Desktop "Open with" → manifest file_handlers → window.launchQueue.
// The consumer reads the payload ONCE (it is deleted on read).

export const SHARE_CACHE = 'gainslab-share-v1';
export const SHARE_KEY = '/__shared-csv__';
export const IMPORT_CSV_ACTION = 'import-csv';

export interface SharedCsvPayload {
    name: string;
    text: string;
}

export type SharedCsvLaunch =
    | { kind: 'none' }
    | { kind: 'error' }
    | { kind: 'file'; payload: SharedCsvPayload };

/** Reads and deletes the file the service worker stored for us. */
export const consumeSharedCsvFromCache = async (
    cacheStorage: CacheStorage | undefined = typeof caches !== 'undefined' ? caches : undefined,
): Promise<SharedCsvPayload | null> => {
    if (!cacheStorage) return null;
    try {
        const cache = await cacheStorage.open(SHARE_CACHE);
        const response = await cache.match(SHARE_KEY);
        if (!response) return null;
        await cache.delete(SHARE_KEY);
        const data = (await response.json()) as Partial<SharedCsvPayload> | null;
        if (!data || typeof data.text !== 'string') return null;
        return { name: typeof data.name === 'string' ? data.name : 'shared.csv', text: data.text };
    } catch {
        return null;
    }
};

/**
 * Handles a ?action=import-csv launch: strips the query (so a reload never
 * re-imports) and returns the shared file, an error marker, or nothing.
 */
export const consumeSharedCsvLaunch = async (
    location: Pick<Location, 'search' | 'pathname'> = window.location,
    history: Pick<History, 'replaceState'> = window.history,
    cacheStorage?: CacheStorage,
): Promise<SharedCsvLaunch> => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') !== IMPORT_CSV_ACTION) return { kind: 'none' };
    history.replaceState({}, '', location.pathname);
    if (params.get('error')) return { kind: 'error' };
    const payload = await consumeSharedCsvFromCache(cacheStorage);
    return payload ? { kind: 'file', payload } : { kind: 'error' };
};

interface LaunchParamsLike {
    files?: ReadonlyArray<{ getFile(): Promise<{ name: string; text(): Promise<string> }> }>;
}

/** Desktop file_handlers: subscribes to window.launchQueue (Chromium only). */
export const subscribeFileHandlerLaunches = (
    onFile: (payload: SharedCsvPayload) => void,
    target: { launchQueue?: { setConsumer(consumer: (params: LaunchParamsLike) => void): void } } =
        window as unknown as { launchQueue?: { setConsumer(consumer: (params: LaunchParamsLike) => void): void } },
): boolean => {
    if (!target.launchQueue) return false;
    target.launchQueue.setConsumer(async (params) => {
        const handle = params?.files?.[0];
        if (!handle) return;
        try {
            const file = await handle.getFile();
            onFile({ name: file.name, text: await file.text() });
        } catch {
            // Unreadable file: ignore (the user can still import from Datos).
        }
    });
    return true;
};
