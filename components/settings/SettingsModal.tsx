import React, { Suspense } from 'react';

interface SettingsModalProps {
    onClose: () => void;
    onOpenProgram: () => void;
    onOpenExercises: () => void;
    onOpenTwoBlock: () => void;
    onReset: () => void;
    onExport: () => void;
    onForceSync: () => void;
    onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onLogin: () => void;
    isSyncing: boolean;
}

const LazySettingsModal = React.lazy(() =>
    import('./SettingsModalImpl').then(module => ({ default: module.SettingsModal }))
);

export const SettingsModal: React.FC<SettingsModalProps> = (props) => (
    <Suspense fallback={<div className="fixed inset-0 z-sheet bg-black/80" />}>
        <LazySettingsModal {...props} />
    </Suspense>
);
