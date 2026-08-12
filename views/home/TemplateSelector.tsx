import React, { Suspense } from 'react';
import type { GlobalTemplate } from '../../types';

interface Props {
    onClose: () => void;
    onSelectTemplate: (tpl: GlobalTemplate) => void;
    onCreateCustom: () => void;
    templates: GlobalTemplate[];
    t: any;
    lang: string;
}

const LazyTemplateSelector = React.lazy(() =>
    import('./TemplateSelectorImpl').then(module => ({ default: module.TemplateSelector }))
);

// Home renders this component only while the picker is open, so the chunk stays
// completely out of the startup path until the user explicitly starts a new plan.
export const TemplateSelector: React.FC<Props> = (props) => (
    <Suspense fallback={<div className="fixed inset-0 z-modal bg-black/90" />}>
        <LazyTemplateSelector {...props} />
    </Suspense>
);
