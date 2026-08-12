import React, { Suspense } from 'react';

export interface CommandAction {
    id: string;
    label: { en: string; es: string };
    description?: { en: string; es: string };
    icon: string;
    accent?: 'primary' | 'amber' | 'violet' | 'emerald' | 'zinc';
    onSelect: () => void;
    keywords?: string[];
    badge?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    actions: CommandAction[];
    title?: string;
}

const LazyCommandPalette = React.lazy(() =>
    import('./CommandPaletteImpl').then(module => ({ default: module.CommandPalette }))
);

export const CommandPalette: React.FC<Props> = (props) => {
    // Keep Framer Motion and palette code out of the initial graph until the
    // launcher is actually opened.
    if (!props.isOpen) return null;

    return (
        <Suspense fallback={null}>
            <LazyCommandPalette {...props} />
        </Suspense>
    );
};
