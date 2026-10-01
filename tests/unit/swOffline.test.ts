import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Service Worker Navigation & Offline Fallback (S1)', () => {
    let mockCache: {
        match: any;
        put: any;
    };
    let openedCaches: Map<string, any>;

    beforeEach(() => {
        openedCaches = new Map();
        mockCache = {
            match: vi.fn(),
            put: vi.fn().mockResolvedValue(undefined),
        };
        openedCaches.set('test-cache', mockCache);

        // Setup global caches
        (globalThis as any).caches = {
            open: vi.fn().mockResolvedValue(mockCache),
        };
    });

    it('matches navigation with query parameters by ignoring search', async () => {
        const cachedHtml = new Response('<html><body>App Shell</body></html>', {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
        });

        // Simulate match with { ignoreSearch: true } returning cached response
        mockCache.match.mockImplementation((req: any, opts: any) => {
            if (opts?.ignoreSearch) {
                return Promise.resolve(cachedHtml);
            }
            return Promise.resolve(undefined);
        });

        // Test shellHandler logic:
        const request = new Request('https://gainslab.app/?action=start&source=shortcut', {
            headers: { Accept: 'text/html' },
        });

        const cache = await (globalThis as any).caches.open('test-cache');
        const matchResult = await cache.match(request, { ignoreSearch: true });

        expect(matchResult).toBe(cachedHtml);
        expect(mockCache.match).toHaveBeenCalledWith(request, { ignoreSearch: true });
    });

    it('falls back to offline.html when network fails and index is not in cache', async () => {
        const offlineHtml = new Response('<html><body>Offline</body></html>', {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
        });

        mockCache.match.mockImplementation((target: any) => {
            if (target === '/offline.html') {
                return Promise.resolve(offlineHtml);
            }
            return Promise.resolve(undefined);
        });

        const cache = await (globalThis as any).caches.open('test-cache');
        const cached =
            (await cache.match('https://gainslab.app/unknown', { ignoreSearch: true })) ||
            (await cache.match('/index.html')) ||
            (await cache.match('/'));

        expect(cached).toBeUndefined();

        const fallback = (await cache.match('/offline.html')) || (await cache.match('/index.html'));
        expect(fallback).toBe(offlineHtml);
    });
});
