import React, { Suspense } from 'react';
import { useApp } from '../context/AppContext';
import { useStore } from '../lib/store';
import { TRANSLATIONS } from '../constants';
import { getTranslated } from '../utils';
import { pickLang } from '../utils/i18n';
import { Icon } from '../components/ui/Icon';
import { requestQuickStart } from '../components/layout/navigation';
import { usePro } from '../hooks/usePro';
import { useTemplateActions } from './home/applyTemplate';
import { TemplateChangeConfirmation } from './home/TemplateChangeConfirmation';

const ProgramHub = React.lazy(() => import('../components/programs/ProgramHub').then((m) => ({ default: m.ProgramHub })));
const TemplateSelector = React.lazy(() => import('./home/TemplateSelector').then((m) => ({ default: m.TemplateSelector })));
const PaywallModal = React.lazy(() => import('../components/pro/PaywallModal').then((m) => ({ default: m.PaywallModal })));

interface RoutineViewProps {
    onStartDay: (idx: number) => void;
    onEditProgram: () => void;
    onOpenExercises: () => void;
}


/**
 * Fase 3 (Rutina): plan overview + day structure + library actions.
 * Every action delegates to an existing flow (start/edit/library/freestyle);
 * template changes reuse the shared TemplateSelector + applyTemplate actions
 * so Hoy and Rutina apply identical behavior.
 */
export const RoutineView: React.FC<RoutineViewProps> = ({ onStartDay, onEditProgram, onOpenExercises }) => {
    const { program, lang, logs, setProgram, globalTemplates, personalTemplates, userProfile } = useApp();
    const activeMeso = useStore((state) => state.activeMeso);
    const setActiveMeso = useStore((state) => state.setActiveMeso);
    const activeSession = useStore((state) => state.activeSession);
    const { checkPro, showPaywall, setShowPaywall, featureAttempted } = usePro();
    const t = TRANSLATIONS[lang];
    const tp = TRANSLATIONS[lang].copy.programEdit;
    const rv = t.routineView;
    const [showHub, setShowHub] = React.useState(false);
    const [showTemplates, setShowTemplates] = React.useState(false);
    const safeProgram = Array.isArray(program) ? program : [];
    const isKong = Boolean(activeMeso?.programSystem);
    const hasPlan = Boolean(activeMeso) && safeProgram.length > 0;

    const { handleSelectTemplate, handleSelectProgram, handleCreateCustom, templateChangeConfirmation } = useTemplateActions({
        setProgram,
        setActiveMeso,
        setShowTemplateSelector: setShowTemplates,
        onEditProgram,
        checkPro,
        userProfile,
        lang,
    });


    return (
        <div className="space-y-4 px-4 pb-28 pt-3">
            <div>
                <p className="gl-eyebrow">{t.navRoutine}</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-[rgb(var(--text-primary))]">
                    {activeMeso ? activeMeso.name : t.navRoutine}
                </h1>
                {activeMeso && (
                    <p className="gl-num mt-1 text-xs font-medium text-muted">
                        {t.week} {activeMeso.week}
                        {activeMeso.targetWeeks || activeMeso.duration ? ` / ${activeMeso.targetWeeks || activeMeso.duration}` : ''}
                        {' · '}{safeProgram.length} {t.navDiarySessions.toLowerCase()}
                    </p>
                )}
            </div>

            {isKong && activeMeso && (
                <button
                    type="button"
                    onClick={() => setShowHub(true)}
                    className="gl-panel flex w-full items-center gap-3 p-4 text-left"
                >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
                        <Icon name="Layers" size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-[rgb(var(--text-primary))]">KONG</span>
                        <span className="block truncate text-xs text-muted">{activeMeso.name}</span>
                    </span>
                    <Icon name="ChevronRight" size={18} className="shrink-0 text-muted" />
                </button>
            )}

            {hasPlan ? (
                <div className="space-y-2">
                    {safeProgram.map((day, idx) => {
                        const slots = day.slots || [];
                        const totalSets = slots.reduce((sum: number, slot: { setTarget?: number }) => sum + (slot.setTarget || 3), 0);
                        const isDayActiveSession = Boolean(
                            activeSession && activeSession.mesoId === activeMeso?.id && activeSession.dayIdx === idx,
                        );
                        return (
                            <div key={day.id ?? idx} className={`gl-panel flex items-center gap-3 p-4 transition-colors ${isDayActiveSession ? 'border-primary-500/40 bg-primary-500/5' : ''}`}>
                                <span className={`gl-num flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${isDayActiveSession ? 'bg-primary-500 text-[rgb(var(--accent-ink))]' : 'bg-[rgb(var(--surface-raised))] text-muted'}`}>
                                    {idx + 1}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-bold text-[rgb(var(--text-primary))]">
                                        {String(getTranslated(day.dayName, lang))}
                                    </span>
                                    <span className="gl-num block text-xs text-muted">
                                        {isDayActiveSession ? (
                                            <span className="font-semibold text-primary-500 inline-flex items-center gap-1.5">
                                                <span className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse" />
                                                {pickLang(lang, { es: 'En curso', en: 'In progress' })}
                                            </span>
                                        ) : (
                                            `${slots.length} ex · ${totalSets} series`
                                        )}
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onStartDay(idx)}
                                    aria-label={isDayActiveSession
                                        ? `${pickLang(lang, { es: 'Retomar', en: 'Resume' })}: ${String(getTranslated(day.dayName, lang))}`
                                        : `${t.startWorkout}: ${String(getTranslated(day.dayName, lang))}`}
                                    className={`gl-primary min-h-[44px] px-4 inline-flex items-center gap-1.5 font-bold text-xs ${isDayActiveSession ? 'bg-primary-500 text-[rgb(var(--accent-ink))] shadow-md' : ''}`}
                                >
                                    {isDayActiveSession ? (
                                        <>
                                            <Icon name="RotateCcw" size={15} />
                                            <span>{pickLang(lang, { es: 'Retomar', en: 'Resume' })}</span>
                                        </>
                                    ) : (
                                        <Icon name="Play" size={16} fill="currentColor" />
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="gl-panel p-6 text-center">
                    <p className="text-sm font-bold text-[rgb(var(--text-primary))]">{tp.newRoutine}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{t.navRoutineEmptyBody}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setShowTemplates(true)} className="gl-primary min-h-[48px]">
                            {rv.changeTemplate}
                        </button>
                        <button type="button" onClick={handleCreateCustom} className="gl-quiet min-h-[48px]">
                            {tp.newRoutine}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setShowTemplates(true)} className="gl-quiet min-h-[48px]">
                    <Icon name="Layers" size={16} />
                    <span>{rv.changeTemplate}</span>
                </button>
                <button type="button" onClick={onEditProgram} className="gl-quiet min-h-[48px]">
                    <Icon name="Settings2" size={16} />
                    <span>{t.editTemplate}</span>
                </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => requestQuickStart()} className="gl-quiet min-h-[48px]">
                    <Icon name="Zap" size={16} />
                    <span>{t.startWorkout}</span>
                </button>
                <button type="button" onClick={onOpenExercises} className="gl-quiet min-h-[48px]">
                    <Icon name="Dumbbell" size={16} />
                    <span>{t.exercises}</span>
                </button>
            </div>
            <button type="button" onClick={onOpenExercises} className="gl-textbtn">
                <span>{t.exercises}</span>
                <Icon name="ArrowRight" size={16} />
            </button>

            {showHub && activeMeso && (
                <Suspense fallback={null}>
                    <ProgramHub meso={activeMeso} logs={logs} lang={lang} onClose={() => setShowHub(false)} />
                </Suspense>
            )}

            {showTemplates && (
                <Suspense fallback={null}>
                    <TemplateSelector
                        onClose={() => setShowTemplates(false)}
                        onSelectTemplate={handleSelectTemplate}
                        onSelectProgram={handleSelectProgram}
                        onCreateCustom={handleCreateCustom}
                        lang={lang}
                        t={t}
                        templates={[...personalTemplates, ...globalTemplates]}
                    />
                </Suspense>
            )}

            <TemplateChangeConfirmation lang={lang} confirmation={templateChangeConfirmation} />

            {showPaywall && (
                <Suspense fallback={null}>
                    <PaywallModal onClose={() => setShowPaywall(false)} feature={featureAttempted} />
                </Suspense>
            )}
        </div>
    );
};
