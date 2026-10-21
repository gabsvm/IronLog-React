import React from 'react';
import { Icon } from '../ui/Icon';

/** Q18: loading fallbacks shared by the App shell pieces. */
export const LoadingSpinner = () => (
    <div role="status" aria-live="polite" className="h-full flex items-center justify-center text-muted">
        <Icon name="RefreshCw" size={24} className="animate-spin" />
    </div>
);

export const FullScreenLoading = () => (
    <div role="status" aria-live="polite" className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgb(var(--surface-app))] text-muted">
        <Icon name="RefreshCw" size={24} className="animate-spin" />
    </div>
);
