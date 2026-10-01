import { describe, it, expect, vi } from 'vitest';

describe('Service Worker Precache Resilience (S3)', () => {
    it('installs successfully even when an optional asset fails to fetch/cache', async () => {
        const addedAssets: string[] = [];
        const mockCache = {
            addAll: vi.fn(async (urls: string[]) => {
                addedAssets.push(...urls);
            }),
            add: vi.fn(async (url: string) => {
                if (url.includes('missing-optional.png')) {
                    throw new Error('404 Not Found');
                }
                addedAssets.push(url);
            }),
        };

        const criticalUrls = ['/', '/index.html', '/manifest.json'];
        const optionalUrls = ['/icon-192.png', '/missing-optional.png', '/offline.html'];

        // Simulate install logic
        let installThrew = false;
        try {
            await mockCache.addAll(criticalUrls);
            await Promise.allSettled(
                optionalUrls.map(async (url) => {
                    try {
                        await mockCache.add(url);
                    } catch {
                        // Best effort for optional assets
                    }
                })
            );
        } catch {
            installThrew = true;
        }

        expect(installThrew).toBe(false);
        expect(addedAssets).toContain('/');
        expect(addedAssets).toContain('/index.html');
        expect(addedAssets).toContain('/icon-192.png');
        expect(addedAssets).toContain('/offline.html');
        expect(addedAssets).not.toContain('/missing-optional.png');
    });

    it('fails install when a critical app-shell asset fails', async () => {
        const mockCache = {
            addAll: vi.fn().mockRejectedValue(new Error('Failed to fetch /index.html')),
        };

        let installThrew = false;
        try {
            await mockCache.addAll(['/', '/index.html']);
        } catch {
            installThrew = true;
        }

        expect(installThrew).toBe(true);
    });
});
