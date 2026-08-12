import React, { Suspense } from 'react';
import type { ActiveSession } from '../../types';

interface FreestyleSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (session: ActiveSession) => void;
}

const LazyFreestyleSessionModal = React.lazy(() =>
    import('./FreestyleSessionModalImpl').then(module => ({ default: module.FreestyleSessionModal }))
);

export const FreestyleSessionModal: React.FC<FreestyleSessionModalProps> = (props) => {
    // Crucial: do not mount Suspense/Lazy while closed, otherwise the dynamic
    // import would still be requested during App's initial render.
    if (!props.isOpen) return null;

    return (
        <Suspense fallback={<div className="fixed inset-0 z-sheet bg-black/70" />}>
            <LazyFreestyleSessionModal {...props} />
        </Suspense>
    );
};
