import React, { Suspense, useMemo, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import { usePro } from '../../../hooks/usePro';
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
    const { user, logout } = useAuth();
    const { isPro, tier, expiryDate } = usePro();
    const t = TRANSLATIONS[lang];
    const ty = t.you;

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [installInstructions, setInstallInstructions] = useState<string | null>(null);

    const daysRemaining = useMemo(() => {
        if (!expiryDate) return null;
        const diff = expiryDate - Date.now();
        if (diff <= 0) return 0;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }, [expiryDate]);

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

    const accountLabel = !user
        ? ty.localMode
        : tier === 'demo'
            ? `${ty.demoAccount}${daysRemaining != null ? ` · ${daysRemaining} ${daysRemaining === 1 ? ty.dayLeft : ty.daysLeft}` : ''}`
            : isPro ? ty.proMember : ty.freeMember;
    const planLabel = isPro && tier && tier !== 'demo'
        ? ((t.planTypes as Record<string, string>)[tier] || tier)
        : null;

    const userName = user?.displayName || user?.email?.split('@')[0] || ty.defaultUser;
    const userInitial = (userName[0] || 'G').toUpperCase();

    return (
        <div id="profile-section-account" className="space-y-4">
            {!isStandalone && (
                <div data-install-banner className="rounded-[8px] border border-primary-500/40 bg-surface-raised p-3.5 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                    <div>
                        <h3 className="font-bold text-xs uppercase tracking-wide flex items-center gap-2 text-[rgb(var(--text-primary))]">
                            <Icon name="Download" size={15} className="text-primary-500" />
                            {t.installApp}
                        </h3>
                        <p className="text-[11px] text-muted font-medium mt-1 max-w-[180px] leading-tight">
                            {t.installDesc}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleInstallClick}
                        className="rounded-[6px] bg-primary-500 text-zinc-950 font-bold text-xs px-3.5 py-2 hover:bg-primary-400 active:scale-95 transition-all shadow-sm"
                    >
                        {t.installBtn}
                    </button>
                </div>
            )}

            <div className="label-reference px-1">{ty.account}</div>
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[8px] bg-surface-raised border border-border-subtle flex items-center justify-center font-bold text-xl text-white shadow-sm shrink-0">
                    {userInitial}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-white truncate">{userName}</span>
                        {isPro && (
                            <span className="chip-reference text-amber-400 font-semibold">
                                Pro
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-muted truncate mt-0.5">
                        {user?.email ? `${user.email} · ` : ''}{planLabel || accountLabel}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="card-reference rounded-[8px] border border-border-subtle bg-surface-raised p-3">
                    <div className="text-lg font-semibold text-white tabular-nums">{stats.total}</div>
                    <div className="text-xs text-muted">{ty.sessions}</div>
                </div>
                <div className="card-reference rounded-[8px] border border-border-subtle bg-surface-raised p-3">
                    <div className="text-lg font-semibold text-white tabular-nums">{stats.recent}</div>
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
                    className="w-full py-2.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-[6px] text-xs font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
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
                    className="w-full py-2.5 bg-primary-500 text-black rounded-[6px] text-xs font-bold hover:bg-primary-400 shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                >
                    {t.auth.signInRegister}
                </button>
            )}

            {user && (
                <div className="card-reference rounded-[8px] border border-border-subtle bg-surface-raised divide-y divide-border-subtle overflow-hidden">
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic('light');
                            setShowDeleteDialog(true);
                        }}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-red-500/10 transition-colors"
                    >
                        <span className="w-8 h-8 rounded-[6px] bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                            <Icon name="Trash2" size={17} />
                        </span>
                        <div className="flex-1 text-sm font-medium text-red-400">{t.deleteAccount.rowLabel}</div>
                        <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />
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
                isPro={isPro}
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
