import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const ORIGIN = 'https://gainslab.test';
// Vitest rewrites import.meta.url, so resolve from the project root instead.
const SW_SOURCE = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8');

type FakeResponse = { status: number; type: string; body: string; clone(): FakeResponse };
type FakeRequest = { url: string; method: string; mode: string };

const makeResponse = (body: string, status = 200, type = 'basic'): FakeResponse => ({
    status,
    type,
    body,
    clone() {
        return makeResponse(body, status, type);
    },
});

const toAbsoluteUrl = (input: string | { url: string }): string => {
    const raw = typeof input === 'string' ? input : input.url;
    return new URL(raw, ORIGIN).toString();
};

const stripSearch = (absoluteUrl: string): string => {
    const parsed = new URL(absoluteUrl);
    return `${parsed.origin}${parsed.pathname}`;
};

/** Minimal CacheStorage mock with real ignoreSearch semantics. */
const createCachesMock = () => {
    const stores = new Map<string, Map<string, unknown>>();
    const storeFor = (name: string) => {
        let store = stores.get(name);
        if (!store) {
            store = new Map<string, unknown>();
            stores.set(name, store);
        }
        return store;
    };

    const cachesMock: any = {
        __stores: stores,
        __matchCalls: [] as any[],
        open: async (name: string) => {
            const store = storeFor(name);
            const fetchFn: any = (cachesMock as any).__fetch;
            return {
                match: async (input: string | { url: string }, options?: { ignoreSearch?: boolean; ignoreVary?: boolean }) => {
                    (cachesMock.__matchCalls as any[]).push({ input, options });
                    const absolute = toAbsoluteUrl(input);
                    if (store.has(absolute)) return store.get(absolute);
                    if (options?.ignoreSearch) {
                        const wanted = stripSearch(absolute);
                        for (const [key, value] of store) {
                            if (stripSearch(key) === wanted) return value;
                        }
                    }
                    return undefined;
                },
                put: async (input: string | { url: string }, response: unknown) => {
                    store.set(toAbsoluteUrl(input), response);
                },
                add: async (input: string | { url: string }) => {
                    const absolute = toAbsoluteUrl(input);
                    const response = await fetchFn(absolute);
                    store.set(absolute, response);
                },
                addAll: async (inputs: Array<string | { url: string }>) => {
                    const responses = await Promise.all(inputs.map((input) => fetchFn(toAbsoluteUrl(input))));
                    inputs.forEach((input, index) => {
                        store.set(toAbsoluteUrl(input), responses[index]);
                    });
                },
                keys: async () => [...store.keys()].map((url) => ({ url })),
                delete: async (input: string | { url: string }) => store.delete(toAbsoluteUrl(input)),
            };
        },
        keys: async () => [...stores.keys()],
        delete: async (name: string) => stores.delete(name),
    };
    return cachesMock;
};

interface SWHarness {
    listeners: Map<string, (event: any) => void>;
    cachesMock: any;
    setFetch: (fn: (...args: any[]) => Promise<any>) => void;
    dispatchFetch: (url: string, mode?: string) => Promise<any>;
    dispatchInstall: () => Promise<void>;
    cacheEntries: () => string[];
    primeCache: (entries: Array<[string, FakeResponse]>) => Promise<void>;
    lastWaitUntilCalls: () => any[];
}

const loadRealServiceWorker = (fetchImpl: (...args: any[]) => Promise<any>, source: string = SW_SOURCE): SWHarness => {
    const lastDispatch: { waitUntilCalls: any[] } = { waitUntilCalls: [] };
    const listeners = new Map<string, (event: any) => void>();
    const cachesMock = createCachesMock();
    let fetchFn = fetchImpl;
    cachesMock.__fetch = (...args: any[]) => fetchFn(...args);

    const sandbox: any = {
        self: {
            location: { origin: ORIGIN },
            addEventListener: (type: string, handler: (event: any) => void) => {
                listeners.set(type, handler);
            },
            skipWaiting: () => {},
            clients: { claim: () => {}, matchAll: async () => [] },
            registration: { showNotification: async () => {} },
        },
        caches: cachesMock,
        fetch: (...args: any[]) => fetchFn(...args),
        clients: { matchAll: async () => [], openWindow: async () => null },
        Response,
        Request,
        URL,
        setTimeout,
        clearTimeout,
        console,
    };
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'sw.js' });
    const swCacheName: string = vm.runInContext('CACHE_NAME', sandbox);

    const cacheEntries = (): string[] => {
        const entries: string[] = [];
        for (const store of (cachesMock.__stores as Map<string, Map<string, unknown>>).values()) {
            entries.push(...store.keys());
        }
        return entries;
    };

    return {
        listeners,
        cachesMock,
        setFetch: (fn) => {
            fetchFn = fn;
        },
        dispatchFetch: async (url: string, mode = 'navigate') => {
            const handler = listeners.get('fetch');
            if (!handler) throw new Error('SW registered no fetch listener');
            const request: FakeRequest = { url, method: 'GET', mode };
            let responsePromise: Promise<any> | undefined;
            const waitUntilCalls: any[] = [];
            lastDispatch.waitUntilCalls = waitUntilCalls;
            handler({
                request,
                respondWith: (promise: Promise<any>) => (responsePromise = promise),
                waitUntil: (promise: Promise<any>) => waitUntilCalls.push(promise),
            });
            if (!responsePromise) throw new Error(`SW ignored fetch for ${url}`);
            return responsePromise;
        },
        lastWaitUntilCalls: () => lastDispatch.waitUntilCalls,
        dispatchInstall: async () => {
            const handler = listeners.get('install');
            if (!handler) throw new Error('SW registered no install listener');
            let waitPromise: Promise<any> | undefined;
            handler({ waitUntil: (promise: Promise<any>) => (waitPromise = promise) });
            await waitPromise;
        },
        primeCache: async (entries) => {
            const cache = await cachesMock.open(swCacheName);
            for (const [url, response] of entries) {
                await cache.put(url, response);
            }
        },
        cacheEntries,
    };
};

const offlineFetch = () => Promise.reject(new Error('network offline'));

describe('Service Worker (real public/sw.js in vm)', () => {
    let sw: SWHarness;

    beforeEach(() => {
        sw = loadRealServiceWorker(offlineFetch);
    });

    it('serves the cached shell for navigation URLs with query params', async () => {
        await sw.primeCache([['/index.html', makeResponse('<html>APP SHELL</html>')]]);

        const response = await sw.dispatchFetch(`${ORIGIN}/?action=start&source=shortcut`, 'navigate');

        expect(response.body).toContain('APP SHELL');
        const navigationMatch = (sw.cachesMock.__matchCalls as any[]).find((call) => call.options?.ignoreSearch);
        expect(navigationMatch?.options?.ignoreVary).toBe(true);
    });

    it('falls back to offline.html when nothing is cached and the network fails', async () => {
        await sw.primeCache([['/offline.html', makeResponse('<html>OFFLINE PAGE</html>')]]);

        const response = await sw.dispatchFetch(`${ORIGIN}/some/deep/link`, 'navigate');

        expect(response.body).toContain('OFFLINE PAGE');
    });

    it('installs critical assets and skips failing optional ones without failing', async () => {
        sw.setFetch(async (input: any) => {
            const url = typeof input === 'string' ? input : String(input?.url ?? input);
            if (url.includes('logo-mark.png')) throw new Error('404 Not Found');
            return makeResponse(`network:${url}`);
        });

        await sw.dispatchInstall();

        const entries = sw.cacheEntries();
        expect(entries).toContain(`${ORIGIN}/`);
        expect(entries).toContain(`${ORIGIN}/index.html`);
        expect(entries).toContain(`${ORIGIN}/manifest.json`);
        expect(entries).toContain(`${ORIGIN}/offline.html`);
        expect(entries).not.toContain(`${ORIGIN}/assets/branding/logo-mark.png`);
    });

    it('fails the install when a critical asset cannot be cached', async () => {
        sw.setFetch(async (input: any) => {
            const url = typeof input === 'string' ? input : String(input?.url ?? input);
            if (url.endsWith('/index.html')) throw new Error('404 Not Found');
            return makeResponse(`network:${url}`);
        });

        await expect(sw.dispatchInstall()).rejects.toThrow();
    });

    it('trimCache never deletes precached entries when the runtime cache overflows', async () => {
        const seed: Array<[string, FakeResponse]> = [
            ['/index.html', makeResponse('shell')],
            ['/offline.html', makeResponse('offline')],
            ['/icon-192.png', makeResponse('icon')],
        ];
        for (let i = 0; i < 130; i += 1) {
            seed.push([`/assets/runtime-${i}.js`, makeResponse(`runtime ${i}`)]);
        }
        await sw.primeCache(seed);

        // A fresh static asset arrives over the network (200/basic => cached + trimmed).
        sw.setFetch(async () => makeResponse('fresh asset'));
        const response = await sw.dispatchFetch(`${ORIGIN}/assets/app-new.js`, 'no-cors');
        expect(response.body).toBe('fresh asset');
        // staleWhileRevalidate trims in a background .then(); let it settle.
        await new Promise((resolve) => setTimeout(resolve, 25));

        const entries = sw.cacheEntries();
        expect(entries).toContain(`${ORIGIN}/index.html`);
        expect(entries).toContain(`${ORIGIN}/offline.html`);
        expect(entries).toContain(`${ORIGIN}/icon-192.png`);
        expect(entries).toContain(`${ORIGIN}/assets/app-new.js`);
        expect(entries.length).toBeLessThanOrEqual(120 + 3);
        expect((sw.cachesMock.__matchCalls as any[]).some((call) => call.options?.ignoreVary)).toBe(true);
    });

    it('does NOT fail the install when a LAZY asset fails (one retry, then skipped)', async () => {
        const stamped = SW_SOURCE.replace(
            '/* __BUILD_LAZY_URLS__ */',
            `  '/assets/lazy-ok.js',\n  '/assets/lazy-fail.js',`
        );
        const lazySw = loadRealServiceWorker(offlineFetch, stamped);
        const attempts = new Map<string, number>();
        lazySw.setFetch(async (input: any) => {
            const url = typeof input === 'string' ? input : String(input?.url ?? input);
            attempts.set(url, (attempts.get(url) ?? 0) + 1);
            if (url.includes('lazy-fail.js')) throw new Error('404 Not Found');
            return makeResponse(`network:${url}`);
        });

        await lazySw.dispatchInstall();

        const entries = lazySw.cacheEntries();
        expect(entries).toContain(`${ORIGIN}/index.html`);
        expect(entries).toContain(`${ORIGIN}/assets/lazy-ok.js`);
        expect(entries).not.toContain(`${ORIGIN}/assets/lazy-fail.js`);
        // One initial attempt plus exactly one retry.
        expect(attempts.get(`${ORIGIN}/assets/lazy-fail.js`)).toBe(2);
    });

    it('invokes event.waitUntil with the revalidation promise on cached navigations', async () => {
        await sw.primeCache([['/index.html', makeResponse('<html>APP SHELL</html>')]]);

        const response = await sw.dispatchFetch(`${ORIGIN}/?action=start`, 'navigate');

        expect(response.body).toContain('APP SHELL');
        const calls = sw.lastWaitUntilCalls();
        expect(calls).toHaveLength(1);
        expect(typeof (calls[0] as Promise<unknown>).then).toBe('function');
    });

    it('invokes event.waitUntil with the revalidation promise on cached static assets', async () => {
        await sw.primeCache([['/assets/app.js', makeResponse('old asset')]]);
        sw.setFetch(async () => makeResponse('fresh asset'));

        const response = await sw.dispatchFetch(`${ORIGIN}/assets/app.js`, 'no-cors');

        // Stale served immediately while the network revalidates in waitUntil.
        expect(response.body).toBe('old asset');
        const calls = sw.lastWaitUntilCalls();
        expect(calls).toHaveLength(1);
        await calls[0];
        const cache = await sw.cachesMock.open('gainslab-pro-__BUILD_ID__');
        expect((await cache.match(`${ORIGIN}/assets/app.js`)).body).toBe('fresh asset');
    });
});

describe('S1: service worker registers only live handlers', () => {
    it('no push / sync / periodicsync handlers (nothing subscribes or registers them)', () => {
        const sw = loadRealServiceWorker(async () => makeResponse('ok'));
        expect([...sw.listeners.keys()].sort()).toEqual(['activate', 'fetch', 'install', 'message', 'notificationclick']);
    });
});
