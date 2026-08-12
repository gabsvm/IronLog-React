import React, { Suspense } from 'react';

interface PaywallModalProps {
    onClose: () => void;
    feature?: string;
}

const LazyPaywallModal = React.lazy(() =>
    import('./PaywallModalImpl').then(module => ({ default: module.PaywallModal }))
);

export const PaywallModal: React.FC<PaywallModalProps> = (props) => (
    <Suspense fallback={<div className="fixed inset-0 z-sheet bg-black/80" />}>
        <LazyPaywallModal {...props} />
    </Suspense>
);
