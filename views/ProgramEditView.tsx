import React from 'react';
import { TRANSLATIONS } from '../constants';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { useProgramEditState, type ProgramEditViewProps } from './programEdit/useProgramEditState';
import { ProgramEditDays } from './programEdit/ProgramEditDays';
import { ProgramEditDialogs } from './programEdit/ProgramEditDialogs';

// T2: state lives in views/programEdit/useProgramEditState; render blocks in views/programEdit/.
export type { ProgramEditViewProps } from './programEdit/useProgramEditState';



export const ProgramEditView: React.FC<ProgramEditViewProps> = (props) => {
    const state = useProgramEditState(props);
    const { onBack, lang, t, isStructuredKong, isEditingActiveRoutine, saveStatus, handleValidateAndOpenStartModal } = state;


    if (isStructuredKong) {
        return (
            <div className="flex h-full flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]">
                <div className="flex min-h-14 pt-safe shrink-0 items-center border-b border-[rgb(var(--border-subtle))] px-4">
                    <button onClick={onBack} className="flex min-h-11 items-center gap-2 text-sm font-bold text-[rgb(var(--text-secondary))]" aria-label={t.back}>
                        <Icon name="ChevronLeft" size={20} /> {t.back}
                    </button>
                </div>
                <div className="flex flex-1 items-center justify-center p-6">
                    <div className="w-full max-w-sm rounded-3xl border border-primary-500/25 bg-[rgb(var(--surface-raised))] p-6 text-center shadow-xl">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
                            <Icon name="Lock" size={24} />
                        </div>
                        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-primary-500">KONG</p>
                        <h1 className="mt-2 text-2xl font-black">{TRANSLATIONS[lang].copy.programEdit.structuredProgram}</h1>
                        <p className="mt-3 text-sm leading-6 text-[rgb(var(--text-secondary))]">
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

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-zinc-950 relative">
            {/* Header: clearly distinguishes Edit vs Create */}
            <div className="glass px-4 min-h-14 pt-safe shrink-0 flex items-center justify-between z-10 border-b border-zinc-200 dark:border-white/5">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    aria-label={t.back}
                >
                    <Icon name="ChevronLeft" size={20} />
                    <span className="font-bold text-sm">{t.back}</span>
                </button>

                <h1 className="font-bold text-sm text-zinc-900 dark:text-white truncate max-w-[180px]">
                    {isEditingActiveRoutine
                        ? (TRANSLATIONS[lang].copy.programEdit.editActiveRoutine)
                        : (TRANSLATIONS[lang].copy.programEdit.newRoutine)}
                </h1>

                <div className="flex items-center gap-2">
                    {isEditingActiveRoutine ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                            <Icon name="Check" size={12} strokeWidth={3} />
                            <span>{saveStatus === 'saved' ? (TRANSLATIONS[lang].copy.programEdit.saved) : (TRANSLATIONS[lang].copy.programEdit.saving)}</span>
                        </div>
                    ) : (
                        <button
                            onClick={handleValidateAndOpenStartModal}
                            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-black px-3.5 py-1.5 rounded-full text-xs font-black shadow-lg shadow-primary-500/25 active:scale-95 transition-all"
                        >
                            <Icon name="Play" size={12} fill="currentColor" />
                            {TRANSLATIONS[lang].copy.programEdit.start}
                        </button>
                    )}
                </div>
            </div>

            <ProgramEditDays state={state} />

            <ProgramEditDialogs state={state} />
        </div>
    );
};
