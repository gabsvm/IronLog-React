import { formatMessage, pickLang } from '../../utils/i18n';
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../ui/Icon';

const ConfirmModal = React.lazy(() => import('../ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));

interface AppBannersProps {
    hasActiveSession: boolean;
    skippedSessionToast?: { id: number; name: string; weekSnapshot?: unknown } | null;
    onUndoSkip?: () => void;
}

/**
 * Q18: sync-truncation + SW-update banners, moved verbatim from App
 * (subscriptions, deferred-update state and the update confirm dialog).
 * Memoized: props are a boolean + a rare toast object + a stable callback,
 * so per-set session commits in AppContent skip this subtree entirely.
 */
export const AppBanners: React.FC<AppBannersProps> = React.memo(({
    hasActiveSession,
    skippedSessionToast,
    onUndoSkip,
}) => {
    const { lang } = useApp();
    const t = TRANSLATIONS[lang];

    const [updateRegistration, setUpdateRegistration] = useState<ServiceWorkerRegistration | null>(null);
    const [dismissedUpdate, setDismissedUpdate] = useState(false);
    const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);

    const applySwUpdate = useCallback(() => {
        setShowUpdateConfirm(false);
        (window as any).__USER_TRIGGERED_SW_UPDATE__ = true;
        const target = updateRegistration?.waiting || updateRegistration?.installing;
        if (target) {
            target.postMessage({ type: 'SKIP_WAITING' });
        } else {
            window.location.reload();
        }
    }, [updateRegistration]);

    // Sync truncation warning — fires when cloud history is capped at 200 entries
    const [syncTruncatedWarning, setSyncTruncatedWarning] = useState<{ kept: number; total: number } | null>(null);
    // Local persistence failure — fires when an IndexedDB write fails (quota,
    // private mode). The hook keeps the value pending; the banner offers retry.
    const [persistFailedKeys, setPersistFailedKeys] = useState<string[]>([]);
    useEffect(() => {
        const onError = (e: Event) => {
            const key = (e as CustomEvent<{ key: string }>).detail?.key;
            setPersistFailedKeys((prev) => (key && !prev.includes(key) ? [...prev, key] : prev));
        };
        const onOk = (e: Event) => {
            const key = (e as CustomEvent<{ key: string }>).detail?.key;
            setPersistFailedKeys((prev) => (key ? prev.filter((k) => k !== key) : prev));
        };
        window.addEventListener('ironlog:persist-error', onError);
        window.addEventListener('ironlog:persist-ok', onOk);
        return () => {
            window.removeEventListener('ironlog:persist-error', onError);
            window.removeEventListener('ironlog:persist-ok', onOk);
        };
    }, []);
    useEffect(() => {
        const handler = (e: Event) => {
            const { kept, total } = (e as CustomEvent).detail;
            setSyncTruncatedWarning({ kept, total });
        };
        window.addEventListener('ironlog:sync-truncated', handler);
        return () => window.removeEventListener('ironlog:sync-truncated', handler);
    }, []);

    useEffect(() => {
        const handleUpdateAvailable = (event: Event) => {
            const detail = (event as CustomEvent<{ registration?: ServiceWorkerRegistration; isPreloadError?: boolean }>).detail;
            setDismissedUpdate(false);
            if (detail?.registration) {
                setUpdateRegistration(detail.registration);
            } else if (detail?.isPreloadError) {
                setUpdateRegistration(prev => prev || ({} as any));
            }
        };

        window.addEventListener('ironlog:update-available', handleUpdateAvailable);
        return () => window.removeEventListener('ironlog:update-available', handleUpdateAvailable);
    }, []);

    return (
        <>
            {syncTruncatedWarning && (
                <div className="fixed top-safe left-0 right-0 z-[200] flex justify-center px-4 pt-3 pointer-events-none">
                    <div role="status" aria-live="polite" className="pointer-events-auto flex items-center gap-3 bg-amber-950/90 border border-amber-500/40 text-amber-200 text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md max-w-sm w-full">
                        <Icon name="AlertTriangle" size={16} className="text-amber-400 shrink-0" />
                        <span className="flex-1">
                            {formatMessage(TRANSLATIONS[lang].copy.appBanners.cloudHistoryCappedAt, { kept: syncTruncatedWarning.kept, total: syncTruncatedWarning.total })}
                        </span>
                        <button onClick={() => setSyncTruncatedWarning(null)} className="text-amber-400 hover:text-white transition-colors">
                            <Icon name="X" size={16} />
                        </button>
                    </div>
                </div>
            )}

            {persistFailedKeys.length > 0 && (
                <div className="fixed top-safe left-0 right-0 z-[200] flex justify-center px-4 pt-3 pointer-events-none">
                    <div role="alert" aria-live="assertive" className="pointer-events-auto flex items-center gap-3 bg-red-950/90 border border-red-500/40 text-red-200 text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md max-w-sm w-full">
                        <Icon name="AlertTriangle" size={16} className="text-red-400 shrink-0" />
                        <span className="flex-1">
                            {TRANSLATIONS[lang].copy.appBanners.persistWriteFailed}
                        </span>
                        <button
                            type="button"
                            onClick={() => window.dispatchEvent(new CustomEvent('ironlog:persist-retry'))}
                            className="rounded-xl bg-red-500/20 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-red-200 transition-colors hover:bg-red-500/30"
                        >
                            {TRANSLATIONS[lang].copy.appBanners.persistWriteRetry}
                        </button>
                    </div>
                </div>
            )}

            {updateRegistration && !dismissedUpdate && (
                <div className="fixed top-safe left-0 right-0 z-toast flex justify-center px-4 pt-3 pointer-events-none">
                    <div role="status" aria-live="polite" className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-border-strong bg-surface-base px-4 py-3 text-xs font-semibold text-[rgb(var(--text-primary))] shadow-xl">
                        <Icon name="Download" size={16} className="text-primary-400 shrink-0" />
                        <span className="flex-1">
                            {t.updateBannerReady}
                        </span>
                        <button
                            onClick={() => {
                                if (hasActiveSession) {
                                    setShowUpdateConfirm(true);
                                    return;
                                }
                                applySwUpdate();
                            }}
                            className="gl-primary shrink-0 px-3 text-xs"
                        >
                            {t.updateBannerAction}
                        </button>
                        <button
                            onClick={() => setDismissedUpdate(true)}
                            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-raised hover:text-[rgb(var(--text-primary))]"
                            aria-label={t.updateBannerDismiss}
                        >
                            <Icon name="X" size={16} />
                        </button>
                    </div>
                </div>
            )}

            {showUpdateConfirm && updateRegistration && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={t.updateConfirmTitle}
                        description={t.updateConfirmActiveWorkout}
                        confirmText={t.updateBannerAction}
                        cancelText={t.cancel}
                        onConfirm={applySwUpdate}
                        onCancel={() => setShowUpdateConfirm(false)}
                        variant="primary"
                    />
                </Suspense>
            )}
            {skippedSessionToast && (
                <div role="status" aria-live="polite" className="fixed left-1/2 -translate-x-1/2 z-toast flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl text-sm text-white" style={{ bottom: 'calc(var(--safe-area-bottom) + 88px)' }}>
                    <span>{skippedSessionToast.name}: {t.skipped || pickLang(lang, { en: 'Skipped', es: 'Saltado' })}</span>
                    {onUndoSkip && (
                        <button type="button" onClick={onUndoSkip} className="min-h-[44px] px-3 rounded-lg bg-primary-500/20 text-primary-400 font-semibold text-xs hover:bg-primary-500/30 transition-colors">
                            {t.undo || pickLang(lang, { en: 'Undo', es: 'Deshacer' })}
                        </button>
                    )}
                </div>
            )}
        </>
    );
});
