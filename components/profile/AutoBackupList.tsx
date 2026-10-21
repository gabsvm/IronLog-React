import React, { Suspense, useEffect, useState } from 'react';
import { TRANSLATIONS } from '../../constants/translations';
import { Icon } from '../ui/Icon';
import {
    listAutoBackups,
    restoreAutoBackup,
    type AutoBackupEntry,
} from '../../services/autoBackup';

const ConfirmModal = React.lazy(() =>
    import('../ui/ConfirmModal').then((m) => ({ default: m.ConfirmModal })),
);

interface AutoBackupListProps {
    lang: keyof typeof TRANSLATIONS;
    /** Defaults to reloading the page; tests inject a spy. */
    onRestored?: () => void;
}

/** Q6: automatic snapshot list with confirmed restore, for Datos. */
export const AutoBackupList: React.FC<AutoBackupListProps> = ({ lang, onRestored }) => {
    const t = TRANSLATIONS[lang].you;
    const [backups, setBackups] = useState<AutoBackupEntry[] | null>(null);
    const [pendingAt, setPendingAt] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        void listAutoBackups().then((list) => {
            if (!cancelled) setBackups(list);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const pending = pendingAt === null ? null : backups?.find((b) => b.at === pendingAt) ?? null;

    const confirmRestore = async () => {
        if (pendingAt === null) return;
        await restoreAutoBackup(pendingAt);
        if (onRestored) {
            onRestored();
        } else {
            window.location.reload();
        }
    };

    return (
        <div className="gl-panel space-y-2 p-4">
            <div className="label-reference mb-1">{t.autoBackups}</div>
            {backups === null || backups.length === 0 ? (
                <div className="text-xs text-muted">{t.autoBackupsEmpty}</div>
            ) : (
                <div className="divide-y divide-border-subtle">
                    {[...backups].reverse().map((backup) => (
                        <div key={backup.at} className="flex items-center justify-between gap-2 py-2">
                            <span className="flex items-center gap-2 text-xs font-medium text-[rgb(var(--text-primary))]">
                                <Icon name="CloudDownload" size={14} className="text-muted" />
                                {new Date(backup.at).toLocaleString(lang)}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPendingAt(backup.at)}
                            className="gl-quiet min-h-[44px] px-4 text-xs"
                            >
                                {t.restore}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {pending !== null && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={t.restoreTitle}
                        description={t.restoreDesc.replace(
                            '{date}',
                            new Date(pending.at).toLocaleString(lang),
                        )}
                        confirmText={t.restore}
                        cancelText={TRANSLATIONS[lang].cancel}
                        variant="danger"
                        onConfirm={() => void confirmRestore()}
                        onCancel={() => setPendingAt(null)}
                    />
                </Suspense>
            )}
        </div>
    );
};
