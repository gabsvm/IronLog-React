import React from 'react';
import { Icon } from '../ui/Icon';

/** Q18: loading fallbacks shared by the App shell pieces. */
export const LoadingSpinner = () => (
    <div className="h-full flex items-center justify-center text-zinc-400">
        <Icon name="RefreshCw" size={24} className="animate-spin" />
    </div>
);

export const FullScreenLoading = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950 text-zinc-400">
        <Icon name="RefreshCw" size={24} className="animate-spin" />
    </div>
);
