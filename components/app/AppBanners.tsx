import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../ui/Icon';

const ConfirmModal = React.lazy(() => import('../ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));

interface AppBannersProps {
    activeSession: any;
}

/**
 * Q18: sync-truncation + SW-update banners, moved verbatim from App
 * (subscriptions, deferred-update state and the update confirm dialog).
 */
export const AppBanners: React.FC<AppBannersProps> = ({ activeSession }) => {
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
                            {lang === 'es'
                                ? `Historial en nube limitado a ${syncTruncatedWarning.kept} sesiones (de ${syncTruncatedWarning.total}). El historial local está completo.`
                                : `Cloud history capped at ${syncTruncatedWarning.kept} of ${syncTruncatedWarning.total} sessions. Local history is complete.`}
                        </span>
                        <button onClick={() => setSyncTruncatedWarning(null)} className="text-amber-400 hover:text-white transition-colors">
                            <Icon name="X" size={16} />
                        </button>
                    </div>
                </div>
            )}

            {updateRegistration && !dismissedUpdate && (
                <div className="fixed top-safe left-0 right-0 z-[210] flex justify-center px-4 pt-3 pointer-events-none">
                    <div role="status" aria-live="polite" className="pointer-events-auto flex items-center gap-3 bg-zinc-950/95 border border-primary-500/30 text-zinc-100 text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md max-w-md w-full">
                        <Icon name="Download" size={16} className="text-primary-400 shrink-0" />
                        <span className="flex-1">
                            {t.updateBannerReady}
                        </span>
                        <button
                            onClick={() => {
                                if (activeSession) {
                                    setShowUpdateConfirm(true);
                                    return;
                                }
                                applySwUpdate();
                            }}
                            className="rounded-xl bg-primary-500 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-black transition-colors hover:bg-primary-400"
                        >
                            {t.updateBannerAction}
                        </button>
                        <button
                            onClick={() => setDismissedUpdate(true)}
                            className="text-zinc-500 hover:text-white transition-colors"
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
        </>
    );
};
