import { describe, it, expect, vi } from 'vitest';
import {
    SHARE_CACHE,
    SHARE_KEY,
    consumeSharedCsvFromCache,
    consumeSharedCsvLaunch,
    subscribeFileHandlerLaunches,
} from '../../utils/sharedCsv';

// Minimal CacheStorage with real put/match/delete semantics on one store.
const fakeCaches = (seed?: { name: string; text: string } | string) => {
    const stores = new Map<string, Map<string, string>>();
    const store = (name: string) => {
        if (!stores.has(name)) stores.set(name, new Map());
        return stores.get(name)!;
    };
    if (seed !== undefined) {
        store(SHARE_CACHE).set(SHARE_KEY, typeof seed === 'string' ? seed : JSON.stringify(seed));
    }
    const cacheStorage = {
        open: async (name: string) => ({
            match: async (key: string) => {
                const body = store(name).get(key);
                return body === undefined ? undefined : new Response(body);
            },
            delete: async (key: string) => store(name).delete(key),
        }),
    } as unknown as CacheStorage;
    return { cacheStorage, stores, has: () => store(SHARE_CACHE).has(SHARE_KEY) };
};

const launchAt = (search: string) => ({
    location: { search, pathname: '/' },
    history: { replaceState: vi.fn() },
});

describe('S3: consumeSharedCsvFromCache', () => {
    it('returns the stored file once and deletes it', async () => {
        const c = fakeCaches({ name: 'hevy.csv', text: 'title,start_time\n' });
        expect(await consumeSharedCsvFromCache(c.cacheStorage)).toEqual({ name: 'hevy.csv', text: 'title,start_time\n' });
        expect(c.has()).toBe(false);
        expect(await consumeSharedCsvFromCache(c.cacheStorage)).toBeNull();
    });

    it('is null without CacheStorage or with a malformed payload', async () => {
        expect(await consumeSharedCsvFromCache(undefined)).toBeNull();
        expect(await consumeSharedCsvFromCache(fakeCaches('not json').cacheStorage)).toBeNull();
        expect(await consumeSharedCsvFromCache(fakeCaches(JSON.stringify({ name: 'x' })).cacheStorage)).toBeNull();
    });
});

describe('S3: consumeSharedCsvLaunch', () => {
    it('ignores normal launches and leaves the URL alone', async () => {
        const { location, history } = launchAt('?action=start');
        expect(await consumeSharedCsvLaunch(location, history, fakeCaches().cacheStorage)).toEqual({ kind: 'none' });
        expect(history.replaceState).not.toHaveBeenCalled();
    });

    it('a share launch strips the query and hands over the file', async () => {
        const { location, history } = launchAt('?action=import-csv');
        const c = fakeCaches({ name: 's.csv', text: 'Date,Workout Name\n' });
        const launch = await consumeSharedCsvLaunch(location, history, c.cacheStorage);
        expect(launch).toEqual({ kind: 'file', payload: { name: 's.csv', text: 'Date,Workout Name\n' } });
        expect(history.replaceState).toHaveBeenCalledWith({}, '', '/');
    });

    it('reports an error when the SW flagged it or nothing was stored', async () => {
        const flagged = launchAt('?action=import-csv&error=share');
        expect(await consumeSharedCsvLaunch(flagged.location, flagged.history, fakeCaches({ name: 'a', text: 'b' }).cacheStorage))
            .toEqual({ kind: 'error' });
        const empty = launchAt('?action=import-csv');
        expect(await consumeSharedCsvLaunch(empty.location, empty.history, fakeCaches().cacheStorage)).toEqual({ kind: 'error' });
    });
});

describe('S3: subscribeFileHandlerLaunches', () => {
    it('reads the first launched file; no launchQueue → false', async () => {
        expect(subscribeFileHandlerLaunches(() => {}, {})).toBe(false);
        let consumer: ((p: any) => void) | null = null;
        const onFile = vi.fn();
        const ok = subscribeFileHandlerLaunches(onFile, { launchQueue: { setConsumer: (c) => { consumer = c as any; } } });
        expect(ok).toBe(true);
        await (consumer as any)({ files: [{ getFile: async () => ({ name: 'f.csv', text: async () => 'a,b' }) }] });
        expect(onFile).toHaveBeenCalledWith({ name: 'f.csv', text: 'a,b' });
        await (consumer as any)({ files: [] });
        expect(onFile).toHaveBeenCalledTimes(1);
    });
});
