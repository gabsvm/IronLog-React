// U10: backups in the user's Google Drive (hidden appDataFolder: the app only
// sees its own files, the user's Drive stays private to it). The REST calls
// are the same on web and Android; only the token source differs
// (utils/googleDriveAuth.ts). Restoring reuses the regular backup validation.
import {
    createBackupEnvelope,
    restoreBackupToStorage,
    validateAndMigrateBackup,
    type GainsLabBackupState,
    type GainsLabBackupV1,
} from './backupService';

export const DRIVE_BACKUP_KEEP = 5;
const API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,size';
const NAME_PREFIX = 'gainslab-backup-';

export interface DriveBackupFile {
    id: string;
    name: string;
    modifiedTime: string;
    size?: number;
}

export type TokenProvider = (opts: { forceRefresh: boolean }) => Promise<string>;

export class DriveError extends Error {
    constructor(message: string, readonly status: number) {
        super(message);
        this.name = 'DriveError';
    }
}

export interface DriveClient {
    list(): Promise<DriveBackupFile[]>;
    upload(name: string, json: string): Promise<DriveBackupFile>;
    download(id: string): Promise<unknown>;
    remove(id: string): Promise<void>;
}

export const createDriveClient = (getToken: TokenProvider, fetchImpl: typeof fetch = (input, init) => fetch(input, init)): DriveClient => {
    // One retry with a fresh token on 401 (expired or revoked token).
    const call = async (url: string, init: RequestInit = {}): Promise<Response> => {
        for (let attempt = 0; attempt < 2; attempt += 1) {
            const token = await getToken({ forceRefresh: attempt > 0 });
            const res = await fetchImpl(url, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` } });
            if (res.status === 401 && attempt === 0) continue;
            if (!res.ok) throw new DriveError(`drive ${res.status}`, res.status);
            return res;
        }
        throw new DriveError('drive 401', 401);
    };

    return {
        async list() {
            const q = encodeURIComponent(`name contains '${NAME_PREFIX}' and trashed = false`);
            const res = await call(`${API}?spaces=appDataFolder&q=${q}&orderBy=modifiedTime%20desc&pageSize=50&fields=files(id,name,modifiedTime,size)`);
            const body = (await res.json()) as { files?: Array<DriveBackupFile & { size?: string | number }> };
            return (body.files || []).map((f) => ({ ...f, size: f.size === undefined ? undefined : Number(f.size) }));
        },
        async upload(name, json) {
            const boundary = `gainslab${Math.random().toString(36).slice(2)}`;
            const metadata = JSON.stringify({ name, parents: ['appDataFolder'], mimeType: 'application/json' });
            const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${json}\r\n--${boundary}--`;
            const res = await call(UPLOAD, { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body });
            return (await res.json()) as DriveBackupFile;
        },
        async download(id) {
            const res = await call(`${API}/${encodeURIComponent(id)}?alt=media`);
            return res.json();
        },
        async remove(id) {
            await call(`${API}/${encodeURIComponent(id)}`, { method: 'DELETE' });
        },
    };
};

export const driveBackupName = (now: Date = new Date()): string =>
    `${NAME_PREFIX}${now.toISOString().replace(/[:.]/g, '-')}.json`;

/** Uploads a backup, then prunes to the newest DRIVE_BACKUP_KEEP. */
export const backupToDrive = async (
    state: GainsLabBackupState,
    client: DriveClient,
    keep: number = DRIVE_BACKUP_KEEP,
): Promise<DriveBackupFile> => {
    const envelope = createBackupEnvelope(state);
    const file = await client.upload(driveBackupName(), JSON.stringify(envelope));
    try {
        const all = await client.list();
        const stale = all
            .filter((f) => f.id !== file.id)
            .sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime))
            .slice(Math.max(0, keep - 1));
        for (const f of stale) await client.remove(f.id);
    } catch {
        // pruning is best effort; the new backup is already stored
    }
    return file;
};

/** Downloads, validates and writes a Drive backup into storage (the caller reloads). */
export const restoreFromDrive = async (client: DriveClient, id: string): Promise<GainsLabBackupV1> => {
    const raw = await client.download(id);
    const result = validateAndMigrateBackup(raw);
    if (!result.valid) throw new Error('drive backup invalid');
    await restoreBackupToStorage(result.backup);
    return result.backup;
};
