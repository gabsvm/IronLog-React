/**
 * Optional Firebase App Check bootstrap. When VITE_FIREBASE_APPCHECK_SITE_KEY
 * is set, initializes App Check with a reCAPTCHA v3 provider right after the
 * Firebase app exists; otherwise nothing is imported and behavior is identical
 * to before. Initialization runs at most once per app instance.
 */
export interface AppCheckModule {
    initializeAppCheck(app: any, options: { provider: any; isTokenAutoRefreshEnabled: boolean }): any;
    ReCaptchaV3Provider: new (siteKey: string) => any;
}

export interface AppCheckInitOptions {
    env: Record<string, string | undefined>;
    isDev: boolean;
    importAppCheck: () => Promise<AppCheckModule>;
}

const initedApps = new WeakMap<object, Promise<unknown>>();

const initAppCheckIfConfigured = async (app: object, opts: AppCheckInitOptions): Promise<unknown> => {
    const siteKey = opts.env.VITE_FIREBASE_APPCHECK_SITE_KEY;
    if (!siteKey) return undefined;

    if (opts.isDev && opts.env.VITE_FIREBASE_APPCHECK_DEBUG) {
        (globalThis as { FIREBASE_APPCHECK_DEBUG_TOKEN?: unknown }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    try {
        const appCheckApi = await opts.importAppCheck();
        return appCheckApi.initializeAppCheck(app, {
            provider: new appCheckApi.ReCaptchaV3Provider(siteKey),
            isTokenAutoRefreshEnabled: true,
        });
    } catch (err) {
        // App Check must never break app startup (e.g. blocked CDN in a
        // WebView): requests simply go without a token until Enforce is on.
        console.warn('App Check initialization failed, continuing without it:', err);
        return undefined;
    }
};

export const initAppCheckOnce = (app: object, opts: AppCheckInitOptions): Promise<unknown> => {
    const cached = initedApps.get(app);
    if (cached) return cached;
    const pending = initAppCheckIfConfigured(app, opts);
    initedApps.set(app, pending);
    return pending;
};
