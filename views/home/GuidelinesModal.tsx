import React, { Suspense } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    images?: string[];
}

const LazyGuidelinesModal = React.lazy(() =>
    import('./GuidelinesModalImpl').then(module => ({ default: module.GuidelinesModal }))
);

export const GuidelinesModal: React.FC<Props> = (props) => {
    if (!props.isOpen || !props.images || props.images.length === 0) return null;

    return (
        <Suspense fallback={<div className="fixed inset-0 z-modal bg-black/90" />}>
            <LazyGuidelinesModal {...props} />
        </Suspense>
    );
};
