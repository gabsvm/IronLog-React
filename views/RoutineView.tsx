import React, { Suspense } from 'react';
import { useApp } from '../context/AppContext';
import { useStore } from '../lib/store';
import { TRANSLATIONS } from '../constants';
import { getTranslated } from '../utils';
import { pickLang } from '../utils/i18n';
import { Icon } from '../components/ui/Icon';
import { requestQuickStart } from '../components/layout/navigation';
import { useTemplateActions } from './home/applyTemplate';
import { TemplateChangeConfirmation } from './home/TemplateChangeConfirmation';

const ProgramHub = React.lazy(() => import('../components/programs/ProgramHub').then((m) => ({ default: m.ProgramHub })));
const TemplateSelector = React.lazy(() => import('./home/TemplateSelector').then((m) => ({ default: m.TemplateSelector })));

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
    const { program, lang, logs, setProgram, globalTemplates, personalTemplates, userProfile, exercises } = useApp();
    const activeMeso = useStore((state) => state.activeMeso);
    const setActiveMeso = useStore((state) => state.setActiveMeso);
    const activeSession = useStore((state) => state.activeSession);
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
        userProfile,
        lang,
    });


    // Same rule as Hoy: a day counts as done once this week has a log for it.
    const daysDone = new Set(
        (Array.isArray(logs) ? logs : [])
            .filter((log) => activeMeso && log.mesoId === activeMeso.id && log.week === activeMeso.week)
            .map((log) => log.dayIdx),
    );
    const nextIdx = safeProgram.findIndex((_, idx) => !daysDone.has(idx));
    const totalWeeks = activeMeso?.targetWeeks || activeMeso?.duration;
    const slotName = (slot: { exerciseId?: string; muscle?: string }) => {
        const def = slot.exerciseId ? exercises?.find((exercise) => exercise.id === slot.exerciseId) : undefined;
        return def ? String(getTranslated(def.name, lang)) : String((t.muscle as Record<string, string>)[slot.muscle || ''] || slot.exerciseId || slot.muscle || '');
    };
    const actions = [
        { key: 'quick', icon: 'Zap', label: t.startWorkout, onClick: () => requestQuickStart() },
        { key: 'template', icon: 'Layers', label: rv.changeTemplate, onClick: () => setShowTemplates(true) },
        { key: 'edit', icon: 'Settings2', label: t.editTemplate, onClick: onEditProgram },
        { key: 'library', icon: 'Dumbbell', label: t.exercises, onClick: onOpenExercises },
    ] as const;

    return (
        <div className="space-y-4 px-4 pb-28 pt-3">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[rgb(var(--text-primary))]">
                    {activeMeso ? activeMeso.name : t.navRoutine}
                </h1>
                {activeMeso && (
                    <p className="gl-num mt-1 text-xs font-medium text-muted">
                        {t.week} {activeMeso.week}{totalWeeks ? ` / ${totalWeeks}` : ''}
                    </p>
                )}
            </div>

            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-4">
            {isKong && activeMeso && (
                <button
                    type="button"
                    onClick={() => setShowHub(true)}
                    className="gl-panel flex min-h-[56px] w-full items-center gap-3 px-4 text-left"
                >
                    <Icon name="Layers" size={18} className="shrink-0 text-[rgb(var(--accent-text))]" />
                    <span className="min-w-0 flex-1 text-sm font-semibold text-[rgb(var(--text-primary))]">KONG</span>
                    <Icon name="ChevronRight" size={18} className="shrink-0 text-muted" />
                </button>
            )}

            {hasPlan ? (
                <ul className="gl-panel divide-y divide-[rgb(var(--border-subtle))] overflow-hidden shadow-sm">
                    {safeProgram.map((day, idx) => {
                        const slots = day.slots || [];
                        const dayName = String(getTranslated(day.dayName, lang));
                        const isDayActiveSession = Boolean(
                            activeSession && activeSession.mesoId === activeMeso?.id && activeSession.dayIdx === idx,
                        );
                        const isDone = daysDone.has(idx);
                        // One primary action: the session in progress, else the next day to train.
                        const isPrimary = isDayActiveSession || (!activeSession && idx === nextIdx);
                        return (
                            <li key={day.id ?? idx} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02]">
                                <span className={`gl-num flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isDone ? 'bg-primary-500/15 text-[rgb(var(--accent-text))]' : 'bg-[rgb(var(--surface-raised))] text-muted'}`}>
                                    {isDone ? <Icon name="Check" size={15} strokeWidth={3} aria-label={t.completed} /> : idx + 1}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{dayName}</span>
                                    <span className="mt-0.5 block truncate text-xs text-muted">
                                        {isDayActiveSession
                                            ? <span className="font-semibold text-[rgb(var(--accent-text))]">{pickLang(lang, { es: 'En curso', en: 'In progress' })}</span>
                                            : slots.map(slotName).filter(Boolean).join(' · ')}
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onStartDay(idx)}
                                    aria-label={isDayActiveSession
                                        ? `${pickLang(lang, { es: 'Retomar', en: 'Resume' })}: ${dayName}`
                                        : `${t.startWorkout}: ${dayName}`}
                                    className={`${isPrimary ? 'gl-primary' : 'gl-quiet'} !min-h-[40px] shrink-0 !px-3 rounded-xl text-xs font-semibold`}
                                >
                                    {isDayActiveSession ? (
                                        <>
                                            <Icon name="RotateCcw" size={14} />
                                            <span>{pickLang(lang, { es: 'Retomar', en: 'Resume' })}</span>
                                        </>
                                    ) : (
                                        <Icon name="Play" size={15} fill="currentColor" />
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="gl-panel p-6 text-center">
                    <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{tp.newRoutine}</p>
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
            </div>

            <ul className="gl-panel divide-y divide-[rgb(var(--border-subtle))] overflow-hidden shadow-sm">
                {actions.map((action) => (
                    <li key={action.key}>
                        <button type="button" onClick={action.onClick} className="flex min-h-[52px] w-full items-center gap-3 px-4 text-left text-sm font-medium text-[rgb(var(--text-primary))]">
                            <Icon name={action.icon} size={18} className="shrink-0 text-muted" />
                            <span className="min-w-0 flex-1">{action.label}</span>
                            <Icon name="ChevronRight" size={16} className="shrink-0 text-muted" />
                        </button>
                    </li>
                ))}
            </ul>
            </div>

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

        </div>
    );
};
