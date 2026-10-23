
import React, { useState, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../ui/Icon';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants/translations';

const PaywallModal = React.lazy(() => import('./PaywallModal').then(m => ({ default: m.PaywallModal })));

interface ProLockProps {
    children: React.ReactNode;
    featureName: string;
}

/**
 * Free users get a compact unlock row instead of the feature: the card title
 * already names it, and skipping the hidden chart avoids rendering work nobody sees.
 */
export const ProLock: React.FC<ProLockProps> = ({ children, featureName }) => {
    const { subscription } = useAuth();
    const { lang } = useApp();
    const [showModal, setShowModal] = useState(false);

    if (subscription.isPro) {
        return <>{children}</>;
    }

    return (
        <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-[rgb(var(--border-subtle))] px-3 py-2">
            <Icon name="Lock" size={16} className="shrink-0 text-muted" />
            <button
                type="button"
                onClick={() => setShowModal(true)}
                aria-label={`${TRANSLATIONS[lang].copy.paywallModal.unlockPro}: ${featureName}`}
                className="gl-quiet"
            >
                {TRANSLATIONS[lang].copy.paywallModal.unlockPro}
            </button>

            {showModal && (
                <Suspense fallback={null}>
                    <PaywallModal onClose={() => setShowModal(false)} feature={featureName} />
                </Suspense>
            )}
        </div>
    );
};
