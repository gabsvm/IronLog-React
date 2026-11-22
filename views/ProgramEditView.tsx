import React from 'react';
import { TRANSLATIONS } from '../constants';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { MuscleTag } from '../components/ui/MuscleTag';
import { pickLang } from '../utils/i18n';
import { resolveMuscleLabel } from '../utils/muscle';
import type { MusclePriorityLevel } from '../types';
import { useProgramEditState, type ProgramEditViewProps } from './programEdit/useProgramEditState';
import { ProgramEditDays } from './programEdit/ProgramEditDays';
import { ProgramEditDialogs } from './programEdit/ProgramEditDialogs';

// T2: state lives in views/programEdit/useProgramEditState; render blocks in views/programEdit/.
export type { ProgramEditViewProps } from './programEdit/useProgramEditState';

const PRIORITIES: MusclePriorityLevel[] = ['emphasize', 'grow', 'maintain'];

export const ProgramEditView: React.FC<ProgramEditViewProps> = (props) => {
    const state = useProgramEditState(props);
    const {
        onBack, lang, t, isStructuredKong, isEditingActiveRoutine, saveStatus,
        showPrioritiesStep, setShowPrioritiesStep, musclePriorities, handleSetMusclePriority, priorityCounts,
    } = state;

    if (isStructuredKong) {
        return (
            <div className="flex h-full flex-col bg-surface-app text-white">
                <div className="flex min-h-14 pt-safe shrink-0 items-center border-b border-border-subtle px-4">
                    <button onClick={onBack} className="flex min-h-11 items-center gap-2 text-sm font-bold text-zinc-400" aria-label={t.back}>
                        <Icon name="ChevronLeft" size={20} /> {t.back}
                    </button>
                </div>
                <div className="flex flex-1 items-center justify-center p-6">
                    <div className="w-full max-w-sm rounded-[6px] border border-primary-500/25 bg-surface-raised p-6 text-center shadow-xl">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[4px] bg-primary-500/10 text-primary-500">
                            <Icon name="Lock" size={24} />
                        </div>
                        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-primary-500">KONG</p>
                        <h1 className="mt-2 text-2xl font-black">{TRANSLATIONS[lang].copy.programEdit.structuredProgram}</h1>
                        <p className="mt-3 text-sm leading-6 text-zinc-400">
                            {TRANSLATIONS[lang].copy.programEdit.theOfficialKongDefinition}
                        </p>
                        <Button onClick={onBack} fullWidth className="mt-6">
                            {TRANSLATIONS[lang].copy.programEdit.backToPlan}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const totalDays = state.program.length;
    const totalSets = state.program.reduce(
        (acc, d) => acc + (d.slots || []).reduce((sAcc, sl) => sAcc + (Number(sl.setTarget) || 0), 0),
        0
    );

    return (
        <div className="relative flex h-full flex-col bg-surface-app text-white">
            {/* Header */}
            <header className="z-10 flex min-h-14 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-app px-4 pt-safe">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
                    aria-label={t.back}
                >
                    <Icon name="ChevronLeft" size={20} />
                    <span>{t.back}</span>
                </button>

                <h1 className="font-bold text-sm text-white truncate max-w-[200px]">
                    {isEditingActiveRoutine
                        ? TRANSLATIONS[lang].copy.programEdit.editActiveRoutine
                        : TRANSLATIONS[lang].copy.programEdit.newRoutine}
                </h1>

                <div className="flex items-center gap-2">
                    {isEditingActiveRoutine ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                            <Icon name="Check" size={12} strokeWidth={3} />
                            <span>{saveStatus === 'saved' ? TRANSLATIONS[lang].copy.programEdit.saved : TRANSLATIONS[lang].copy.programEdit.saving}</span>
                        </div>
                    ) : (
                        <div
                            data-testid="program-edit-summary-badge"
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-500/10 border border-primary-500/25 text-primary-300 text-[11px] font-bold tabular-nums"
                        >
                            <span>
                                {totalDays} {pickLang(lang, { es: totalDays === 1 ? 'día' : 'días', en: totalDays === 1 ? 'day' : 'days' })} · {totalSets} {pickLang(lang, { es: 'series', en: 'sets' })}
                            </span>
                        </div>
                    )}
                </div>
            </header>

            {!isEditingActiveRoutine && showPrioritiesStep ? (
                <div className="flex-1 flex flex-col overflow-hidden" data-testid="meso-builder-priorities-step">
                    <div className="px-4 py-3 border-b border-border-subtle bg-surface-raised/60">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-sm font-black uppercase tracking-wider text-white">
                                {pickLang(lang, { es: 'Prioridades musculares', en: 'Muscle group priorities' })}
                            </h2>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold">
                                <span className="rounded bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-rose-300">
                                    {pickLang(lang, { es: 'Enfatizar', en: 'Emphasize' })} [{priorityCounts.emphasize}]
                                </span>
                                <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-emerald-300">
                                    {pickLang(lang, { es: 'Crecer', en: 'Grow' })} [{priorityCounts.grow}]
                                </span>
                                <span className="rounded bg-zinc-700/40 border border-zinc-600/40 px-2 py-0.5 text-zinc-300">
                                    {pickLang(lang, { es: 'Mantener', en: 'Maintain' })} [{priorityCounts.maintain}]
                                </span>
                            </div>
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">
                            {pickLang(lang, {
                                es: 'Elige dónde concentrar más volumen semanal antes de editar cada día.',
                                en: 'Choose where to bias weekly set volume before editing each day.',
                            })}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scroll-container">
                        {priorityCounts.muscles.map((muscle) => {
                            const current: MusclePriorityLevel = musclePriorities[muscle] || 'grow';
                            return (
                                <div
                                    key={muscle}
                                    className="rounded-[8px] border border-border-subtle bg-surface-raised p-3 space-y-2.5"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-white">{resolveMuscleLabel(muscle, lang)}</span>
                                        <MuscleTag
                                            label={
                                                current === 'emphasize' ? pickLang(lang, { es: 'Enfatizar', en: 'Emphasize' })
                                                : current === 'maintain' ? pickLang(lang, { es: 'Mantener', en: 'Maintain' })
                                                : pickLang(lang, { es: 'Crecer', en: 'Grow' })
                                            }
                                            muscle={muscle}
                                            priority={current}
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {PRIORITIES.map((lvl) => (
                                            <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => handleSetMusclePriority(muscle, lvl)}
                                                className={`rounded-[6px] py-1.5 text-xs font-bold transition-colors border ${
                                                    current === lvl
                                                        ? 'bg-primary-500 text-zinc-950 border-primary-500 font-black'
                                                        : 'bg-surface-base border-border-subtle text-zinc-400 hover:text-white'
                                                }`}
                                            >
                                                {lvl === 'emphasize' ? pickLang(lang, { es: 'Enfatizar', en: 'Emphasize' })
                                                    : lvl === 'maintain' ? pickLang(lang, { es: 'Mantener', en: 'Maintain' })
                                                    : pickLang(lang, { es: 'Crecer', en: 'Grow' })}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="shrink-0 border-t border-border-subtle bg-surface-app p-4 pb-safe">
                        <Button fullWidth onClick={() => setShowPrioritiesStep(false)}>
                            {pickLang(lang, { es: 'Continuar al editor de días', en: 'Continue to day editor' })}
                        </Button>
                    </div>
                </div>
            ) : (
                <ProgramEditDays state={state} />
            )}

            <ProgramEditDialogs state={state} />
        </div>
    );
};
