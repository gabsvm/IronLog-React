// S6: empty state (no active mesocycle), moved verbatim from views/HomeViewImpl.tsx.
import React, { Suspense } from 'react';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import type { HomeViewState } from './useHomeViewState';

const TemplateSelector = React.lazy(() => import('./TemplateSelector').then(m => ({ default: m.TemplateSelector })));
const PaywallModal = React.lazy(() => import('../../components/pro/PaywallModal').then(m => ({ default: m.PaywallModal })));

export const HomeEmptyState: React.FC<{ state: HomeViewState }> = ({ state }) => {
    const { onStartFreeSession, globalTemplates, personalTemplates, lang, t, h, showPaywall, setShowPaywall, featureAttempted, showTemplateSelector, setShowTemplateSelector, handleOpenTemplateSelector, handleSelectTemplate, handleSelectProgram, handleCreateCustom } = state;
    return (
        <>
            <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-8 bg-[rgb(var(--surface-app))]">
                <div className="relative z-10 w-full max-w-sm">
                    {/* Hero Card Container */}
                    <div
                        onClick={handleOpenTemplateSelector}
                        className="group w-full aspect-square rounded-[1.5rem] relative overflow-hidden cursor-pointer bg-[rgb(var(--surface-raised))] active:scale-[0.98] transition-all duration-300 border border-[rgb(var(--border-subtle))] flex flex-col items-center justify-center p-8 gap-4"
                    >
                        {/* Clean minimal UI replacing abstract art */}
                        <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center text-primary-500 mb-2">
                            <Icon name="Plus" size={32} strokeWidth={2} />
                        </div>
                        
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                {t.startMeso}
                            </h2>
                            <p className="text-sm text-zinc-400 font-medium">
                                {h.startPlan}
                            </p>
                        </div>
                        <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-white/10 group-hover:ring-white/30 transition-all duration-500"></div>
                    </div>
                </div>

                {/* Optional: Quick Action Button below if card isn't obvious enough */}
                <div className="w-full max-w-xs animate-in fade-in slide-in-from-bottom-4 delay-200">
                    <Button onClick={handleOpenTemplateSelector} variant="secondary" fullWidth className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800">
                        {h.viewTemplates}
                    </Button>
                </div>

                {/* Freestyle / CrossFit / Calisthenics option */}
                {onStartFreeSession && (
                    <div className="w-full max-w-xs animate-in fade-in slide-in-from-bottom-4 delay-300">
                        <button
                            onClick={onStartFreeSession}
                            className="w-full flex items-center gap-3 glass-card rounded-2xl p-4 hover:border-white/10 active:scale-[0.98] transition-all"
                        >
                            <div className="flex gap-1">
                                <div className="w-7 h-7 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center"><Icon name="Dumbbell" size={14} /></div>
                                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><Icon name="Zap" size={14} /></div>
                                <div className="w-7 h-7 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center"><Icon name="User" size={14} /></div>
                            </div>
                            <span className="flex-1 text-left text-xs font-semibold text-zinc-300">
                                {h.freeRowShort}
                            </span>
                            <Icon name="ChevronRight" size={16} className="text-zinc-650" />
                        </button>
                    </div>
                )}

                {/* Modals */}
                {showTemplateSelector && (
                    <Suspense fallback={null}>
                    <TemplateSelector
                        onClose={() => setShowTemplateSelector(false)}
                        onSelectTemplate={handleSelectTemplate}
                        onCreateCustom={handleCreateCustom}
                        templates={[...personalTemplates, ...globalTemplates]}
                        t={t}
                        lang={lang}
                        onSelectProgram={handleSelectProgram}
                    />
                    </Suspense>
                )}
                {showPaywall && (
                    <Suspense fallback={null}>
                        <PaywallModal onClose={() => setShowPaywall(false)} feature={featureAttempted} />
                    </Suspense>
                )}
            </div>
        </>
    );
};
