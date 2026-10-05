// U10: Google Drive backups — REST client against an in-memory Drive, pruning,
// 401 refresh, restore validation, and the Data card.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { db } from '../../utils/db';
import {
    backupToDrive,
    createDriveClient,
    restoreFromDrive,
    DRIVE_BACKUP_KEEP,
    type DriveClient,
} from '../../services/driveBackup';
import { LAST_BACKUP_AT_KEY } from '../../services/autoBackup';
import { DriveBackupCard } from '../../components/profile/DriveBackupCard';

/** Minimal Drive v3 (appDataFolder only) behind fetch. */
const fakeDrive = (opts: { expireFirstToken?: boolean } = {}) => {
    const files = new Map<string, { name: string; modifiedTime: string; body: string; parents: string[] }>();
    let seq = 0;
    const requests: Array<{ method: string; url: string; auth: string | null }> = [];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
        const url = String(input);
        const method = (init.method || 'GET').toUpperCase();
        const auth = new Headers(init.headers).get('Authorization');
        requests.push({ method, url, auth });
        if (opts.expireFirstToken && auth === 'Bearer t0') return new Response('{}', { status: 401 });
        if (url.startsWith('https://www.googleapis.com/upload/drive/v3/files') && method === 'POST') {
            const ct = new Headers(init.headers).get('Content-Type') || '';
            const boundary = /boundary=(.+)$/.exec(ct)?.[1];
            const parts = String(init.body).split(`--${boundary}`).filter((p) => p.includes('\r\n\r\n'));
            const meta = JSON.parse(parts[0].split('\r\n\r\n')[1].trim());
            const body = parts[1].split('\r\n\r\n')[1].replace(/\r\n$/, '');
            seq += 1;
            const id = `f${seq}`;
            const modifiedTime = new Date(Date.UTC(2026, 9, 1, 0, 0, seq)).toISOString();
            files.set(id, { name: meta.name, modifiedTime, body, parents: meta.parents });
            return Response.json({ id, name: meta.name, modifiedTime, size: String(body.length) });
        }
        const m = /^https:\/\/www\.googleapis\.com\/drive\/v3\/files(?:\/([^?]+))?(?:\?(.*))?$/.exec(url);
        if (!m) return new Response('nope', { status: 404 });
        const [, id, query = ''] = m;
        if (!id && method === 'GET') {
            expect(new URLSearchParams(query).get('spaces')).toBe('appDataFolder');
            const list = [...files.entries()]
                .filter(([, f]) => f.parents.includes('appDataFolder'))
                .sort((a, b) => b[1].modifiedTime.localeCompare(a[1].modifiedTime))
                .map(([fid, f]) => ({ id: fid, name: f.name, modifiedTime: f.modifiedTime, size: String(f.body.length) }));
            return Response.json({ files: list });
        }
        const file = files.get(decodeURIComponent(id));
        if (!file) return new Response('{}', { status: 404 });
        if (method === 'DELETE') {
            files.delete(decodeURIComponent(id));
            return new Response(null, { status: 204 });
        }
        return new Response(file.body, { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    let tokenN = 0;
    const getToken = vi.fn(async ({ forceRefresh }: { forceRefresh: boolean }) => (forceRefresh ? `t${++tokenN}` : `t${tokenN}`));
    return { files, requests, fetchImpl, getToken, client: createDriveClient(getToken, fetchImpl as unknown as typeof fetch) };
};

const state = (ids: string[]) => ({ logs: ids.map((id) => ({ id })) }) as never;

describe('U10: Drive REST client', () => {
    beforeEach(async () => {
        await db.clear();
    });

    it('uploads into appDataFolder with a bearer token and round-trips a valid backup', async () => {
        const drive = fakeDrive();
        const file = await backupToDrive(state(['a', 'b']), drive.client);
        expect(drive.files.get(file.id)?.parents).toEqual(['appDataFolder']);
        expect(file.name).toMatch(/^gainslab-backup-\d{4}-\d{2}-\d{2}T.*\.json$/);
        expect(drive.requests.every((r) => r.auth === 'Bearer t0')).toBe(true);

        const restored = await restoreFromDrive(drive.client, file.id);
        expect(restored.state.logs).toEqual([{ id: 'a' }, { id: 'b' }]);
        expect(await db.get('il_logs_v16', null)).toEqual([{ id: 'a' }, { id: 'b' }]);
    });

    it(`keeps only the newest ${DRIVE_BACKUP_KEEP}`, async () => {
        const drive = fakeDrive();
        const ids: string[] = [];
        for (let i = 0; i < DRIVE_BACKUP_KEEP + 2; i += 1) ids.push((await backupToDrive(state([String(i)]), drive.client)).id);
        const left = (await drive.client.list()).map((f) => f.id);
        expect(left).toEqual(ids.slice(-DRIVE_BACKUP_KEEP).reverse());
    });

    it('retries once with a fresh token on 401', async () => {
        const drive = fakeDrive({ expireFirstToken: true });
        expect(await drive.client.list()).toEqual([]);
        expect(drive.getToken.mock.calls.map((c) => c[0].forceRefresh)).toEqual([false, true]);
        expect(drive.requests.map((r) => r.auth)).toEqual(['Bearer t0', 'Bearer t1']);
    });

    it('a non-backup file is rejected and storage is untouched', async () => {
        const drive = fakeDrive();
        const file = await drive.client.upload('gainslab-backup-x.json', JSON.stringify({ hello: 'world' }));
        await db.set('il_logs_v16', [{ id: 'keep' }]);
        await expect(restoreFromDrive(drive.client, file.id)).rejects.toThrow('drive backup invalid');
        expect(await db.get('il_logs_v16', null)).toEqual([{ id: 'keep' }]);
    });
});

describe('U10: DriveBackupCard', () => {
    beforeEach(async () => {
        await db.clear();
    });

    it('hidden when Drive is not available (web without client id)', () => {
        const { container } = render(<DriveBackupCard lang="es" getState={() => state([])} isAvailable={() => false} />);
        expect(container.innerHTML).toBe('');
    });

    it('save → confirmation + reminder stamp; list → restore after confirm', async () => {
        const drive = fakeDrive();
        const onRestored = vi.fn();
        render(<DriveBackupCard lang="es" getState={() => state(['x'])} client={drive.client} isAvailable={() => true} onRestored={onRestored} />);
        fireEvent.click(screen.getByRole('button', { name: 'Guardar en Drive' }));
        expect(await screen.findByRole('status')).toHaveTextContent('Copia guardada en Drive.');
        expect(await db.get(LAST_BACKUP_AT_KEY, null)).toEqual(expect.any(Number));

        fireEvent.click(screen.getByRole('button', { name: 'Ver copias en Drive' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Restaurar' }));
        const dialog = await screen.findByRole('dialog');
        fireEvent.click(Array.from(dialog.querySelectorAll('button')).find((b) => b.textContent === 'Restaurar')!);
        await vi.waitFor(() => expect(onRestored).toHaveBeenCalled());
        expect(await db.get('il_logs_v16', null)).toEqual([{ id: 'x' }]);
    });

    it('shows an error when Drive fails (e.g. consent cancelled)', async () => {
        const failing: DriveClient = {
            list: vi.fn(async () => { throw new Error('cancelled'); }),
            upload: vi.fn(async () => { throw new Error('cancelled'); }),
            download: vi.fn(),
            remove: vi.fn(),
        };
        render(<DriveBackupCard lang="en" getState={() => state([])} client={failing} isAvailable={() => true} />);
        fireEvent.click(screen.getByRole('button', { name: 'Save to Drive' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Could not connect to Google Drive.');
        expect(await db.get(LAST_BACKUP_AT_KEY, null)).toBeNull();
    });
});

describe('U10: web token provider (Google Identity Services)', () => {
    it('asks only for drive.appdata, caches the token, refreshes on demand; hidden without client id', async () => {
        vi.resetModules();
        vi.stubEnv('VITE_GOOGLE_DRIVE_CLIENT_ID', '');
        const off = await import('../../utils/googleDriveAuth');
        expect(off.isDriveBackupAvailable()).toBe(false);

        vi.resetModules();
        vi.stubEnv('VITE_GOOGLE_DRIVE_CLIENT_ID', 'client-123.apps.googleusercontent.com');
        const configs: Array<Record<string, unknown>> = [];
        const prompts: Array<string | undefined> = [];
        let n = 0;
        (window as any).google = {
            accounts: {
                oauth2: {
                    initTokenClient: (config: Record<string, unknown>) => {
                        configs.push(config);
                        return {
                            requestAccessToken: (o?: { prompt?: string }) => {
                                prompts.push(o?.prompt);
                                (config.callback as (r: unknown) => void)({ access_token: `web${++n}`, expires_in: 3600 });
                            },
                        };
                    },
                },
            },
        };
        const auth = await import('../../utils/googleDriveAuth');
        expect(auth.isDriveBackupAvailable()).toBe(true);
        expect(await auth.driveTokenProvider({ forceRefresh: false })).toBe('web1');
        expect(await auth.driveTokenProvider({ forceRefresh: false })).toBe('web1');
        expect(await auth.driveTokenProvider({ forceRefresh: true })).toBe('web2');
        expect(configs).toHaveLength(2);
        expect(configs[0]).toMatchObject({ client_id: 'client-123.apps.googleusercontent.com', scope: 'https://www.googleapis.com/auth/drive.appdata' });
        expect(prompts).toEqual(['consent', '']);
        delete (window as any).google;
        vi.unstubAllEnvs();
    });
});
