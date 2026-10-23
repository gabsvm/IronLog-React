import React, { Suspense, useMemo, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import { isProUser } from '../../../services/entitlementService';
import { TRANSLATIONS } from '../../../constants';
import { countSessionsByScope, filterLogsByScope } from '../../../utils/statsScope';
import { Icon } from '../../ui/Icon';
import { DeleteAccountDialog } from '../DeleteAccountDialog';
import { triggerHaptic } from '../../../utils/audio';

const ConfirmModal = React.lazy(() => import('../../ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));

interface AccountSectionProps {
    onClose: () => void;
    onLogin: () => void;
}

/** Q18: "Cuenta" section, moved verbatim from ProfileSheet. */
export const AccountSection: React.FC<AccountSectionProps> = ({ onClose, onLogin }) => {
    const { lang, deferredPrompt, installApp, isStandalone, logs } = useApp();
    const { user, logout, subscription } = useAuth();
    // No paid tier anymore; only kept so account deletion still warns past PRO buyers.
    const hadPaidSubscription = isProUser(subscription);
    const t = TRANSLATIONS[lang];
    const ty = t.you;

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [installInstructions, setInstallInstructions] = useState<string | null>(null);


    const stats = useMemo(() => {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recent = filterLogsByScope(logs, null).filter((log: any) => (log.endTime || log.startTime || 0) >= thirtyDaysAgo);
        return {
            total: countSessionsByScope(logs, null),
            recent: recent.length,
        };
    }, [logs]);

    const handleInstallClick = () => {
        if (deferredPrompt) {
            installApp();
        } else {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            setInstallInstructions(isIOS ? ty.installIos : ty.installOther);
        }
    };


    const userName = user?.displayName || user?.email?.split('@')[0] || ty.defaultUser;
    const userInitial = (userName[0] || 'G').toUpperCase();

    return (
        <div id="profile-section-account" className="space-y-4">
            {!isStandalone && (
                <div data-install-banner className="gl-panel flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--text-primary))]">
                            <Icon name="Download" size={16} className="text-primary-500" />
                            {t.installApp}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={handleInstallClick}
                        className="gl-primary shrink-0"
                    >
                        {t.installBtn}
                    </button>
                </div>
            )}

            <div className="label-reference px-1">{ty.account}</div>
            <div className="gl-panel flex items-center gap-3 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-elevated text-xl font-semibold text-[rgb(var(--text-primary))]">
                    {userInitial}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-[rgb(var(--text-primary))]">{userName}</span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted">
                        {user?.email || ty.localMode}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="gl-panel p-3">
                    <div className="gl-num text-lg font-bold text-[rgb(var(--text-primary))]">{stats.total}</div>
                    <div className="text-xs text-muted">{ty.sessions}</div>
                </div>
                <div className="gl-panel p-3">
                    <div className="gl-num text-lg font-bold text-[rgb(var(--text-primary))]">{stats.recent}</div>
                    <div className="text-xs text-muted">{ty.last30}</div>
                </div>
            </div>

            {user ? (
                <button
                    type="button"
                    onClick={() => {
                        triggerHaptic('light');
                        logout();
                        onClose();
                    }}
                    className="gl-quiet w-full"
                >
                    {t.auth.logout}
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => {
                        onClose();
                        onLogin();
                    }}
                    className="gl-primary w-full"
                >
                    {t.auth.signInRegister}
                </button>
            )}

            {user && (
                <div className="gl-panel divide-y divide-[rgb(var(--border-subtle))] overflow-hidden">
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic('light');
                            setShowDeleteDialog(true);
                        }}
                        className="flex min-h-[56px] w-full items-center gap-3 p-3 text-left transition-colors hover:bg-[rgb(var(--surface-elevated)/0.5)]"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                            <Icon name="Trash2" size={17} />
                        </span>
                        <span className="flex-1 text-sm font-medium text-red-500">{t.deleteAccount.rowLabel}</span>
                        <Icon name="ChevronRight" size={16} className="shrink-0 text-muted" />
                    </button>
                </div>
            )}

            <DeleteAccountDialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onDeleted={() => {
                    setShowDeleteDialog(false);
                    onClose();
                }}
                isPro={hadPaidSubscription}
            />

            {installInstructions && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={ty.installHow}
                        description={installInstructions}
                        confirmText={ty.understood}
                        cancelText=""
                        variant="primary"
                        onConfirm={() => setInstallInstructions(null)}
                        onCancel={() => setInstallInstructions(null)}
                    />
                </Suspense>
            )}
        </div>
    );
};
