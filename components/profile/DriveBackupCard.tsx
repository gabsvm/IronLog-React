import React, { Suspense, useMemo, useState } from 'react';
import { TRANSLATIONS } from '../../constants/translations';
import { Icon } from '../ui/Icon';
import type { GainsLabBackupState } from '../../services/backupService';
import {
    backupToDrive,
    createDriveClient,
    restoreFromDrive,
    type DriveBackupFile,
    type DriveClient,
} from '../../services/driveBackup';
import { stampBackupExport } from '../../services/autoBackup';
import { driveTokenProvider, isDriveBackupAvailable } from '../../utils/googleDriveAuth';

const ConfirmModal = React.lazy(() =>
    import('../ui/ConfirmModal').then((m) => ({ default: m.ConfirmModal })),
);

interface DriveBackupCardProps {
    lang: keyof typeof TRANSLATIONS;
    getState: () => GainsLabBackupState;
    /** Test seams; production uses the real Drive client and reloads after restore. */
    client?: DriveClient;
    isAvailable?: () => boolean;
    onRestored?: () => void;
}

type Status = 'idle' | 'saving' | 'saved' | 'loading' | 'failed' | 'restoreFailed';

/** U10: manual backup / restore in Google Drive (appDataFolder). */
export const DriveBackupCard: React.FC<DriveBackupCardProps> = ({
    lang,
    getState,
    client: injected,
    isAvailable = isDriveBackupAvailable,
    onRestored,
}) => {
    const t = TRANSLATIONS[lang].you;
    const client = useMemo(() => injected ?? createDriveClient(driveTokenProvider), [injected]);
    const [status, setStatus] = useState<Status>('idle');
    const [files, setFiles] = useState<DriveBackupFile[] | null>(null);
    const [pending, setPending] = useState<DriveBackupFile | null>(null);

    if (!isAvailable()) return null;

    const busy = status === 'saving' || status === 'loading';

    const save = async () => {
        setStatus('saving');
        try {
            const file = await backupToDrive(getState(), client);
            await stampBackupExport();
            setFiles((prev) => (prev ? [file, ...prev.filter((f) => f.id !== file.id)] : prev));
            setStatus('saved');
        } catch {
            setStatus('failed');
        }
    };

    const loadList = async () => {
        setStatus('loading');
        try {
            setFiles(await client.list());
            setStatus('idle');
        } catch {
            setStatus('failed');
        }
    };

    const confirmRestore = async () => {
        if (!pending) return;
        const target = pending;
        setPending(null);
        try {
            await restoreFromDrive(client, target.id);
            if (onRestored) onRestored();
            else window.location.reload();
        } catch {
            setStatus('restoreFailed');
        }
    };

    return (
        <div className="card-reference p-4 space-y-2" data-testid="drive-backup-card">
            <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                    <Icon name="Cloud" size={17} />
                </span>
                <div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-white">{t.driveTitle}</div>
                    <p className="text-[11px] text-muted">{t.driveDesc}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => void save()}
                    disabled={busy}
                    className="py-2.5 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-black disabled:opacity-60"
                >
                    {status === 'saving' ? t.driveSaving : t.driveBackupNow}
                </button>
                <button
                    type="button"
                    onClick={() => void loadList()}
                    disabled={busy}
                    className="py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold disabled:opacity-60"
                >
                    {status === 'loading' ? t.driveLoading : t.driveShowList}
                </button>
            </div>
            {status === 'saved' && <p role="status" className="text-xs font-bold text-emerald-500">{t.driveSaved}</p>}
            {status === 'failed' && <p role="alert" className="text-xs font-bold text-red-500">{t.driveFailed}</p>}
            {status === 'restoreFailed' && <p role="alert" className="text-xs font-bold text-red-500">{t.driveRestoreFailed}</p>}

            {files !== null && (
                files.length === 0 ? (
                    <div className="text-xs text-muted">{t.driveEmpty}</div>
                ) : (
                    <div className="divide-y divide-border-subtle">
                        {files.map((file) => (
                            <div key={file.id} className="flex items-center justify-between gap-2 py-2">
                                <span className="text-xs font-medium text-zinc-900 dark:text-white">
                                    {new Date(file.modifiedTime).toLocaleString(lang)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPending(file)}
                                    className="px-3 py-1.5 text-xs rounded-xl font-bold bg-zinc-100 dark:bg-zinc-800"
                                >
                                    {t.restore}
                                </button>
                            </div>
                        ))}
                    </div>
                )
            )}

            {pending !== null && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={t.restoreTitle}
                        description={t.restoreDesc.replace('{date}', new Date(pending.modifiedTime).toLocaleString(lang))}
                        confirmText={t.restore}
                        cancelText={TRANSLATIONS[lang].cancel}
                        variant="danger"
                        onConfirm={() => void confirmRestore()}
                        onCancel={() => setPending(null)}
                    />
                </Suspense>
            )}
        </div>
    );
};
