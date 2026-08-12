import React, { Suspense } from 'react';

interface AuthModalProps {
    onClose: () => void;
}

const LazyAuthModal = React.lazy(() =>
    import('./AuthModalImpl').then(module => ({ default: module.AuthModal }))
);

export const AuthModal: React.FC<AuthModalProps> = (props) => (
    <Suspense fallback={<div className="fixed inset-0 z-sheet bg-black/80" />}>
        <LazyAuthModal {...props} />
    </Suspense>
);
