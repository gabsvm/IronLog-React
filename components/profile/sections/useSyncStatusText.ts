import { useApp, useSyncStatus } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import { TRANSLATIONS } from '../../../constants';

/**
 * Q18: shared cloud-sync status line (Data section + Advanced error-log card).
 * Moved verbatim from ProfileSheet so both sections render the same text.
 */
export const useSyncStatusText = (): string => {
    const { lang } = useApp();
    const { isOnline, syncStatus } = useSyncStatus();
    const { user } = useAuth();
    const ty = TRANSLATIONS[lang].you;

    if (!user) return ty.localMode;
    if (!isOnline) return ty.syncQueued;
    if (syncStatus.isSyncing) return ty.syncing;
    if (syncStatus.pending > 0) return ty.pendingCount.replace('{pending}', String(syncStatus.pending));
    return ty.upToDate;
};
