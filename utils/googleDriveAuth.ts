// U10: access tokens for Drive backups (scope drive.appdata only).
//   - Android app: Play services AuthorizationClient (GoogleDrivePlugin).
//   - Web/PWA: Google Identity Services token client, only when
//     VITE_GOOGLE_DRIVE_CLIENT_ID is configured; otherwise Drive is hidden.
// Tokens live in memory only (≈1 h); nothing is persisted.
import { Capacitor, registerPlugin } from '@capacitor/core';
import type { TokenProvider } from '../services/driveBackup';

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const GIS_SRC = 'https://accounts.google.com/gsi/client';

interface GoogleDrivePlugin {
    authorize(options: { interactive: boolean }): Promise<{ accessToken: string }>;
    clearToken(options: { accessToken: string }): Promise<void>;
}

const GoogleDrive = registerPlugin<GoogleDrivePlugin>('GoogleDrive');

const isAndroidApp = (): boolean => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export const getDriveClientId = (): string => String(import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID || '').trim();

export const isDriveBackupAvailable = (): boolean => isAndroidApp() || (!Capacitor.isNativePlatform() && getDriveClientId() !== '');

// ─── Web: Google Identity Services ──────────────────────────────────────────
interface GisTokenResponse {
    access_token?: string;
    expires_in?: number | string;
    error?: string;
}

interface GisTokenClient {
    callback: (res: GisTokenResponse) => void;
    error_callback?: (err: unknown) => void;
    requestAccessToken(overrides?: { prompt?: string }): void;
}

interface GisWindow {
    google?: { accounts?: { oauth2?: { initTokenClient(config: Record<string, unknown>): GisTokenClient; revoke?(token: string, done?: () => void): void } } };
}

let gisLoading: Promise<void> | null = null;
const loadGis = (): Promise<void> => {
    if ((window as GisWindow).google?.accounts?.oauth2) return Promise.resolve();
    if (!gisLoading) {
        gisLoading = new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = GIS_SRC;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => {
                gisLoading = null;
                reject(new Error('gis load failed'));
            };
            document.head.appendChild(script);
        });
    }
    return gisLoading;
};

let cached: { token: string; expiresAt: number } | null = null;

const webToken = async (forceRefresh: boolean): Promise<string> => {
    if (!forceRefresh && cached && cached.expiresAt - 60_000 > Date.now()) return cached.token;
    await loadGis();
    const oauth2 = (window as GisWindow).google?.accounts?.oauth2;
    if (!oauth2) throw new Error('gis unavailable');
    return new Promise<string>((resolve, reject) => {
        const client = oauth2.initTokenClient({
            client_id: getDriveClientId(),
            scope: DRIVE_SCOPE,
            callback: (res: GisTokenResponse) => {
                if (!res.access_token) {
                    reject(new Error(res.error || 'no token'));
                    return;
                }
                cached = { token: res.access_token, expiresAt: Date.now() + Number(res.expires_in || 3600) * 1000 };
                resolve(res.access_token);
            },
            error_callback: (err: unknown) => reject(err instanceof Error ? err : new Error('cancelled')),
        });
        client.requestAccessToken({ prompt: cached ? '' : 'consent' });
    });
};

// ─── Android: Play services ─────────────────────────────────────────────────
let nativeLast: string | null = null;

const nativeToken = async (forceRefresh: boolean): Promise<string> => {
    if (forceRefresh && nativeLast) {
        await GoogleDrive.clearToken({ accessToken: nativeLast }).catch(() => undefined);
        nativeLast = null;
    }
    const res = await GoogleDrive.authorize({ interactive: true });
    nativeLast = res.accessToken;
    return res.accessToken;
};

/** Token provider for createDriveClient. Must be first called from a user gesture on web (popup). */
export const driveTokenProvider: TokenProvider = ({ forceRefresh }) =>
    isAndroidApp() ? nativeToken(forceRefresh) : webToken(forceRefresh);

/** Forgets the in-memory token (sign-out / disconnect). */
export const forgetDriveToken = (): void => {
    const token = cached?.token;
    cached = null;
    nativeLast = null;
    if (token) (window as GisWindow).google?.accounts?.oauth2?.revoke?.(token);
};
