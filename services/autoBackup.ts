import { db } from '../utils/db';
import {
    createBackupEnvelope,
    getBackupDownloadFilename,
    restoreBackupToStorage,
    validateAndMigrateBackup,
    type GainsLabBackupState,
    type GainsLabBackupV1,
} from './backupService';


export const AUTO_BACKUP_KEY = 'il_auto_backup_v1';
export const LAST_BACKUP_AT_KEY = 'il_last_backup_at';
export const BACKUP_REMINDER_DISMISSED_KEY = 'il_backup_reminder_dismissed_at';
export const AUTO_BACKUP_KEEP = 3;
export const AUTO_BACKUP_MIN_INTERVAL_MS = 24 * 60 * 60 * 1000;
export const BACKUP_REMINDER_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

export interface AutoBackupEntry {
    at: number;
    envelope: GainsLabBackupV1;
}

export type PersistStatus = 'on' | 'off' | 'unsupported';

export const getStoragePersistStatus = async (): Promise<PersistStatus> => {
    try {
        const storage = navigator.storage;
        if (!storage?.persisted) return 'unsupported';
        return (await storage.persisted()) ? 'on' : 'off';
    } catch {
        return 'unsupported';
    }
};

/** Requests persistent storage once (no-op when already persisted). Never throws. */
export const ensureStoragePersisted = async (): Promise<PersistStatus> => {
    try {
        const storage = navigator.storage;
        if (!storage?.persist || !storage?.persisted) return 'unsupported';
        if (await storage.persisted()) return 'on';
        return (await storage.persist()) ? 'on' : 'off';
    } catch {
        return 'unsupported';
    }
};

export const listAutoBackups = async (): Promise<AutoBackupEntry[]> => {
    try {
        const list = await db.get<AutoBackupEntry[]>(AUTO_BACKUP_KEY, []);
        return [...list].sort((a, b) => a.at - b.at);
    } catch {
        return [];
    }
};

/**
 * Snapshots state after a finished session: at most one per 24 h, keeping the
 * last 3. Fire-and-forget safe: never throws, reports what happened.
 */
export const maybeCreateAutoBackup = async (
    state: GainsLabBackupState,
): Promise<{ created: boolean }> => {
    try {
        const now = Date.now();
        const list = await listAutoBackups();
        const last = list[list.length - 1];
        if (last && now - last.at < AUTO_BACKUP_MIN_INTERVAL_MS) {
            return { created: false };
        }
        const next = [...list, { at: now, envelope: createBackupEnvelope(state) }].slice(-AUTO_BACKUP_KEEP);
        await db.set(AUTO_BACKUP_KEY, next);
        return { created: true };
    } catch {
        return { created: false };
    }
};

/** Restores one automatic snapshot into storage (the caller reloads). */
export const restoreAutoBackup = async (at: number): Promise<GainsLabBackupV1> => {
    const list = await listAutoBackups();
    const found = list.find((entry) => entry.at === at);
    if (!found) throw new Error('auto-backup not found');
    const result = validateAndMigrateBackup(found.envelope);
    if (!result.valid) throw new Error('auto-backup invalid');
    await restoreBackupToStorage(result.backup);
    return result.backup;
};

export const getLastBackupAt = async (): Promise<number | null> => {
    try {
        return await db.get<number | null>(LAST_BACKUP_AT_KEY, null);
    } catch {
        return null;
    }
};

export const getReminderDismissedAt = async (): Promise<number | null> => {
    try {
        return await db.get<number | null>(BACKUP_REMINDER_DISMISSED_KEY, null);
    } catch {
        return null;
    }
};

export const dismissBackupReminder = async (now: number = Date.now()): Promise<void> => {
    try {
        await db.set(BACKUP_REMINDER_DISMISSED_KEY, now);
    } catch {
        // Best-effort.
    }
};

export const latestLogTime = (logs: { endTime?: unknown; startTime?: unknown }[]): number => {
    let latest = 0;
    for (const log of logs) {
        const t = Number(log.endTime || log.startTime || 0);
        if (Number.isFinite(t) && t > latest) latest = t;
    }
    return latest;
};

/**
 * Pure reminder rule: show when the last export is missing or ≥ 14 days old,
 * there are sessions newer than that export, and the user didn't dismiss
 * after the newest session.
 */
export const shouldShowBackupReminder = (input: {
    now: number;
    lastExportAt: number | null;
    logs: { endTime?: unknown; startTime?: unknown }[];
    dismissedAt: number | null;
}): boolean => {
    const latest = latestLogTime(input.logs);
    if (latest <= 0) return false;
    const lastExport = input.lastExportAt ?? 0;
    if (latest <= lastExport) return false;
    if (input.lastExportAt != null && input.now - input.lastExportAt < BACKUP_REMINDER_AFTER_MS) {
        return false;
    }
    if ((input.dismissedAt ?? 0) >= latest) return false;
    return true;
};

type ShareableNavigator = Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files: File[]; title?: string; text?: string }) => Promise<void>;
};

const downloadBlob = (json: string, filename: string): void => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

/**
 * Exports the current state: Web Share with a file when the platform can
 * share files, plain download otherwise. Stamps the export time so the Home
 * reminder stays quiet for 14 days.
 */
export const exportCurrentBackup = async (
    state: GainsLabBackupState,
): Promise<'shared' | 'downloaded'> => {
    const envelope = createBackupEnvelope(state);
    const filename = getBackupDownloadFilename();
    const json = JSON.stringify(envelope, null, 2);
    const nav = navigator as ShareableNavigator;

    if (typeof nav.canShare === 'function' && typeof nav.share === 'function') {
        try {
            const file = new File([json], filename, { type: 'application/json' });
            if (nav.canShare({ files: [file] })) {
                await nav.share({ files: [file], title: 'GainsLab', text: filename });
                await db.set(LAST_BACKUP_AT_KEY, Date.now());
                return 'shared';
            }
        } catch {
            // Fall through to download (user cancel included).
        }
    }

    downloadBlob(json, filename);
    await db.set(LAST_BACKUP_AT_KEY, Date.now());
    return 'downloaded';
};
