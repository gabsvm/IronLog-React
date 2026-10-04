// Q6: automatic local backups — throttle, rotation, restore, reminder rule,
// export share/download, persistent storage.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { db } from '../../utils/db';
import { createBackupEnvelope } from '../../services/backupService';
import {
    AUTO_BACKUP_KEY,
    BACKUP_REMINDER_DISMISSED_KEY,
    dismissBackupReminder,
    ensureStoragePersisted,
    exportCurrentBackup,
    getLastBackupAt,
    getStoragePersistStatus,
    LAST_BACKUP_AT_KEY,
    listAutoBackups,
    maybeCreateAutoBackup,
    restoreAutoBackup,
    shouldShowBackupReminder,
} from '../../services/autoBackup';

const DAY = 24 * 60 * 60 * 1000;
const stateWithLogs = (ids: string[]) => ({ logs: ids.map((id) => ({ id })) }) as never;

describe('Q6: auto-backup throttle and rotation', () => {
    beforeEach(async () => {
        await db.clear();
    });

    it('creates at most one snapshot per 24 h', async () => {
        expect(await maybeCreateAutoBackup(stateWithLogs(['a']))).toEqual({ created: true });
        expect(await maybeCreateAutoBackup(stateWithLogs(['b']))).toEqual({ created: false });
        expect(await listAutoBackups()).toHaveLength(1);
    });

    it('creates again after 24 h and keeps only the last 3', async () => {
        const now = Date.now();
        await db.set(AUTO_BACKUP_KEY, [
            { at: now - 72 * 3600 * 1000, envelope: createBackupEnvelope(stateWithLogs(['old'])) },
            { at: now - 48 * 3600 * 1000, envelope: createBackupEnvelope(stateWithLogs(['mid'])) },
            { at: now - 25 * 3600 * 1000, envelope: createBackupEnvelope(stateWithLogs(['recent'])) },
        ]);
        expect(await maybeCreateAutoBackup(stateWithLogs(['new']))).toEqual({ created: true });
        const list = await listAutoBackups();
        expect(list).toHaveLength(3);
        const ids = list.map((e) => (e.envelope.state.logs as unknown as { id: string }[])[0].id);
        expect(ids).toEqual(['mid', 'recent', 'new']);
    });

    it('restores a snapshot round-trip into storage', async () => {
        await maybeCreateAutoBackup(stateWithLogs(['L1']));
        const [entry] = await listAutoBackups();
        await db.set('il_logs_v16', []);
        expect(await db.get('il_logs_v16', null)).toEqual([]);

        await restoreAutoBackup(entry.at);

        expect(await db.get('il_logs_v16', null)).toEqual([{ id: 'L1' }]);
    });

    it('rejects unknown or invalid snapshots', async () => {
        await expect(restoreAutoBackup(123)).rejects.toThrow('not found');
        await db.set(AUTO_BACKUP_KEY, [{ at: 1, envelope: { schema: 'nope' } }]);
        await expect(restoreAutoBackup(1)).rejects.toThrow('invalid');
    });
});

describe('Q6: backup reminder rule', () => {
    const now = Date.now();
    const logs = [{ endTime: now - DAY }];

    it('shows when never exported and sessions exist', () => {
        expect(
            shouldShowBackupReminder({ now, lastExportAt: null, logs, dismissedAt: null }),
        ).toBe(true);
    });

    it('shows when the export is 14+ days old with newer sessions', () => {
        expect(
            shouldShowBackupReminder({ now, lastExportAt: now - 20 * DAY, logs, dismissedAt: null }),
        ).toBe(true);
    });

    it('hides with a recent export, no newer sessions, or a fresh dismissal', () => {
        expect(
            shouldShowBackupReminder({ now, lastExportAt: now - 5 * DAY, logs, dismissedAt: null }),
        ).toBe(false);
        expect(
            shouldShowBackupReminder({
                now,
                lastExportAt: now - 20 * DAY,
                logs: [{ endTime: now - 30 * DAY }],
                dismissedAt: null,
            }),
        ).toBe(false);
        expect(
            shouldShowBackupReminder({ now, lastExportAt: null, logs: [], dismissedAt: null }),
        ).toBe(false);
        expect(
            shouldShowBackupReminder({ now, lastExportAt: now - 20 * DAY, logs, dismissedAt: now - DAY }),
        ).toBe(false);
    });

    it('re-arms when a session is newer than the dismissal', () => {
        expect(
            shouldShowBackupReminder({
                now,
                lastExportAt: now - 20 * DAY,
                logs,
                dismissedAt: now - 2 * DAY,
            }),
        ).toBe(true);
    });

    it('persists dismissals', async () => {
        await db.clear();
        await dismissBackupReminder(777);
        expect(await db.get(BACKUP_REMINDER_DISMISSED_KEY, null)).toBe(777);
    });
});

describe('Q6: export with Web Share fallback', () => {
    const origCreate = URL.createObjectURL;
    const origRevoke = URL.revokeObjectURL;

    beforeEach(async () => {
        await db.clear();
    });

    afterEach(() => {
        URL.createObjectURL = origCreate;
        URL.revokeObjectURL = origRevoke;
        delete (navigator as { share?: unknown }).share;
        delete (navigator as { canShare?: unknown }).canShare;
    });

    it('shares a file when the platform can share, and stamps the export', async () => {
        const share = vi.fn(async (_data: { files: File[] }) => {});
        Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
        Object.defineProperty(navigator, 'share', { value: share, configurable: true });

        const result = await exportCurrentBackup(stateWithLogs(['L1']));

        expect(result).toBe('shared');
        expect(share).toHaveBeenCalledTimes(1);
        const file = share.mock.calls[0][0].files[0] as File;
        expect(file).toBeInstanceOf(File);
        expect(file.name).toMatch(/^gainslab_backup_.*\.json$/);
        expect(file.size).toBeGreaterThan(0);
        expect(await getLastBackupAt()).toBeGreaterThan(0);
    });

    it('downloads when share is unavailable, and stamps the export', async () => {
        URL.createObjectURL = vi.fn(() => 'blob:mock') as never;
        URL.revokeObjectURL = vi.fn() as never;
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

        const result = await exportCurrentBackup(stateWithLogs(['L1']));

        expect(result).toBe('downloaded');
        expect(click).toHaveBeenCalledTimes(1);
        expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
        expect(await getLastBackupAt()).toBeGreaterThan(0);
        expect(await db.get(LAST_BACKUP_AT_KEY, null)).toBeGreaterThan(0);
        click.mockRestore();
    });

    it('falls back to download when share throws (user cancel)', async () => {
        URL.createObjectURL = vi.fn(() => 'blob:mock') as never;
        URL.revokeObjectURL = vi.fn() as never;
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
        Object.defineProperty(navigator, 'share', {
            value: async () => {
                throw new Error('AbortError');
            },
            configurable: true,
        });

        const result = await exportCurrentBackup(stateWithLogs(['L1']));

        expect(result).toBe('downloaded');
        expect(click).toHaveBeenCalledTimes(1);
        click.mockRestore();
    });
});

describe('Q6: persistent storage', () => {
    const origStorage = (navigator as { storage?: unknown }).storage;

    afterEach(() => {
        if (origStorage === undefined) {
            delete (navigator as { storage?: unknown }).storage;
        } else {
            Object.defineProperty(navigator, 'storage', { value: origStorage, configurable: true });
        }
    });

    it('reports unsupported without the Storage API', async () => {
        Object.defineProperty(navigator, 'storage', { value: undefined, configurable: true });
        expect(await getStoragePersistStatus()).toBe('unsupported');
        expect(await ensureStoragePersisted()).toBe('unsupported');
    });

    it('reads persisted state and requests persistence once', async () => {
        const persisted = vi.fn(async () => true);
        const persist = vi.fn(async () => true);
        Object.defineProperty(navigator, 'storage', {
            value: { persisted, persist },
            configurable: true,
        });
        expect(await getStoragePersistStatus()).toBe('on');
        expect(await ensureStoragePersisted()).toBe('on');
        expect(persist).not.toHaveBeenCalled();

        persisted.mockResolvedValue(false);
        expect(await ensureStoragePersisted()).toBe('on');
        expect(persist).toHaveBeenCalledTimes(1);

        persist.mockResolvedValue(false);
        expect(await ensureStoragePersisted()).toBe('off');
    });
});
