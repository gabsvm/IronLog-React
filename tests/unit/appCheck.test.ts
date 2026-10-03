import { describe, it, expect, vi, afterEach } from 'vitest';
import { initAppCheckOnce } from '../../lib/appCheck';

const makeModule = () => {
    const providerInstances: string[] = [];
    const fakeModule = {
        ReCaptchaV3Provider: class {
            constructor(siteKey: string) {
                providerInstances.push(siteKey);
            }
        },
        initializeAppCheck: vi.fn((app: unknown, opts: unknown) => ({ app, opts })),
    };
    return { fakeModule, providerInstances };
};

const debugTokenOf = () =>
    (globalThis as { FIREBASE_APPCHECK_DEBUG_TOKEN?: unknown }).FIREBASE_APPCHECK_DEBUG_TOKEN;

describe('N5: optional App Check init', () => {
    afterEach(() => {
        delete (globalThis as { FIREBASE_APPCHECK_DEBUG_TOKEN?: unknown }).FIREBASE_APPCHECK_DEBUG_TOKEN;
    });

    it('imports and initializes nothing without the site key', async () => {
        const { fakeModule } = makeModule();
        const importAppCheck = vi.fn(async () => fakeModule);

        const result = await initAppCheckOnce({ app: 1 }, { env: {}, isDev: false, importAppCheck });

        expect(result).toBeUndefined();
        expect(importAppCheck).not.toHaveBeenCalled();
        expect(fakeModule.initializeAppCheck).not.toHaveBeenCalled();
    });

    it('initializes once with the ReCaptchaV3 provider and auto-refresh', async () => {
        const { fakeModule, providerInstances } = makeModule();
        const importAppCheck = vi.fn(async () => fakeModule);
        const app = { app: 2 };
        const env = { VITE_FIREBASE_APPCHECK_SITE_KEY: 'site-key' };

        const first = await initAppCheckOnce(app, { env, isDev: false, importAppCheck });
        const second = await initAppCheckOnce(app, { env, isDev: false, importAppCheck });

        expect(importAppCheck).toHaveBeenCalledTimes(1);
        expect(fakeModule.initializeAppCheck).toHaveBeenCalledTimes(1);
        expect(providerInstances).toEqual(['site-key']);
        expect(fakeModule.initializeAppCheck.mock.calls[0][0]).toBe(app);
        expect(fakeModule.initializeAppCheck.mock.calls[0][1]).toEqual({
            provider: expect.anything(),
            isTokenAutoRefreshEnabled: true,
        });
        expect(second).toBe(first);
    });

    it('enables the debug token only in DEV with its variable', async () => {
        const { fakeModule } = makeModule();
        const env = { VITE_FIREBASE_APPCHECK_SITE_KEY: 'k', VITE_FIREBASE_APPCHECK_DEBUG: '1' };

        await initAppCheckOnce({ app: 3 }, { env, isDev: true, importAppCheck: async () => fakeModule });
        expect(debugTokenOf()).toBe(true);

        delete (globalThis as { FIREBASE_APPCHECK_DEBUG_TOKEN?: unknown }).FIREBASE_APPCHECK_DEBUG_TOKEN;
        await initAppCheckOnce({ app: 4 }, { env, isDev: false, importAppCheck: async () => fakeModule });
        expect(debugTokenOf()).toBeUndefined();

        await initAppCheckOnce(
            { app: 5 },
            { env: { VITE_FIREBASE_APPCHECK_SITE_KEY: 'k' }, isDev: true, importAppCheck: async () => fakeModule },
        );
        expect(debugTokenOf()).toBeUndefined();
    });

    it('never breaks app init when the App Check import fails', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const importAppCheck = vi.fn(async (): Promise<never> => {
                throw new Error('nope');
            });
            await expect(
                initAppCheckOnce({ app: 6 }, { env: { VITE_FIREBASE_APPCHECK_SITE_KEY: 'k' }, isDev: false, importAppCheck }),
            ).resolves.toBeUndefined();
        } finally {
            warn.mockRestore();
        }
    });
});
