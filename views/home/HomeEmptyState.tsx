import React, { Suspense } from 'react';
import { Icon } from '../../components/ui/Icon';
import { HomeQuickActions, HomeResumeSession } from './HomeQuickActions';
import type { HomeViewState } from './useHomeViewState';

const TemplateSelector = React.lazy(() => import('./TemplateSelector').then(m => ({ default: m.TemplateSelector })));
const PaywallModal = React.lazy(() => import('../../components/pro/PaywallModal').then(m => ({ default: m.PaywallModal })));

export const HomeEmptyState: React.FC<{ state: HomeViewState }> = ({ state }) => {
    const { globalTemplates, personalTemplates, lang, t, h, showPaywall, setShowPaywall, featureAttempted, showTemplateSelector, setShowTemplateSelector, handleOpenTemplateSelector, handleSelectTemplate, handleSelectProgram, handleCreateCustom } = state;
    return <div className="mx-auto max-w-2xl space-y-4 px-4 pb-28 pt-4">
        <HomeResumeSession state={state} />
        <section className="gl-panel space-y-4 p-6">
            <Icon name="Layers" size={28} className="text-primary-500" />
            <h1 className="text-2xl font-semibold tracking-tight text-[rgb(var(--text-primary))]">{t.startMeso}</h1>
            <p className="text-sm text-[rgb(var(--text-secondary))]">{h.startPlan}</p>
            <button type="button" onClick={handleOpenTemplateSelector} className={`${state.activeSession ? 'gl-quiet' : 'gl-primary'} min-h-[48px] w-full`}>{h.viewTemplates}</button>
        </section>
        <HomeQuickActions state={state} />
        {showTemplateSelector && <Suspense fallback={null}><TemplateSelector onClose={() => setShowTemplateSelector(false)} onSelectTemplate={handleSelectTemplate} onCreateCustom={handleCreateCustom} templates={[...personalTemplates, ...globalTemplates]} t={t} lang={lang} onSelectProgram={handleSelectProgram} /></Suspense>}
        {showPaywall && <Suspense fallback={null}><PaywallModal onClose={() => setShowPaywall(false)} feature={featureAttempted} /></Suspense>}
    </div>;
};
