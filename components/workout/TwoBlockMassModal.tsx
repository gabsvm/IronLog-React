import React, { Suspense } from 'react';
import type { ActiveSession } from '../../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onStart: (session: ActiveSession) => void;
}

const LazyTwoBlockMassModal = React.lazy(() =>
    import('./TwoBlockMassModalImpl').then(module => ({ default: module.TwoBlockMassModal }))
);

export const TwoBlockMassModal: React.FC<Props> = (props) => {
    if (!props.isOpen) return null;

    return (
        <Suspense fallback={<div className="fixed inset-0 z-sheet bg-black/70" />}>
            <LazyTwoBlockMassModal {...props} />
        </Suspense>
    );
};
