import React, { useEffect, useState } from 'react';
import { TRANSLATIONS } from '../../constants/translations';
import {
    ensureStoragePersisted,
    getStoragePersistStatus,
    type PersistStatus,
} from '../../services/autoBackup';

interface StoragePersistRowProps {
    lang: keyof typeof TRANSLATIONS;
}

/** Q6: persistent-storage status row for ProfileSheet → Advanced diagnostics. */
export const StoragePersistRow: React.FC<StoragePersistRowProps> = ({ lang }) => {
    const t = TRANSLATIONS[lang].you;
    const [status, setStatus] = useState<PersistStatus | null>(null);

    useEffect(() => {
        let cancelled = false;
        void getStoragePersistStatus().then((next) => {
            if (!cancelled) setStatus(next);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const label =
        status === 'on' ? t.storageOn : status === 'off' ? t.storageOff : t.storageUnsupported;

    return (
        <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-bold text-muted">{t.storageTitle}</span>
            <span className="flex items-center gap-2">
                <span className={`font-semibold ${status === 'on' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                    {status === null ? '…' : label}
                </span>
                {status === 'off' && (
                    <button
                        type="button"
                        onClick={() => void ensureStoragePersisted().then(setStatus)}
                    className="gl-quiet min-h-[44px] px-3 text-xs"
                    >
                        {t.storageEnable}
                    </button>
                )}
            </span>
        </div>
    );
};
