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

    return (
        <div className="relative flex h-full flex-col bg-surface-app text-white">
            {/* Header: matches RP builder-4.png */}
            <header className="z-10 flex min-h-14 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-app px-4 pt-safe">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
                    aria-label={t.back}
                >
                    <Icon name="ChevronLeft" size={20} />
                    <span>{t.back}</span>
                </button>

                <h1 className="flex items-center gap-1.5 font-bold text-sm text-white truncate max-w-[200px]">
                    <span>
                        {isEditingActiveRoutine
                            ? TRANSLATIONS[lang].copy.programEdit.editActiveRoutine
                            : TRANSLATIONS[lang].copy.programEdit.newRoutine}
                    </span>
                    <Icon name="Zap" size={14} className="text-primary-400 shrink-0" />
                </h1>

                <div className="flex items-center gap-2">
                    {isEditingActiveRoutine ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                            <Icon name="Check" size={12} strokeWidth={3} />
                            <span>{saveStatus === 'saved' ? TRANSLATIONS[lang].copy.programEdit.saved : TRANSLATIONS[lang].copy.programEdit.saving}</span>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={handleValidateAndOpenStartModal}
                            className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-400 text-zinc-950 px-3 py-1 rounded-[4px] text-xs font-black shadow-md active:scale-95 transition-all"
                        >
                            <Icon name="Play" size={12} fill="currentColor" />
                            <span>{TRANSLATIONS[lang].copy.programEdit.start}</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex h-8 w-8 items-center justify-center rounded-[4px] text-zinc-400 hover:text-white transition-colors"
                        aria-label={t.close || 'Close'}
                    >
                        <Icon name="X" size={18} />
                    </button>
                </div>
            </header>

            <ProgramEditDays state={state} />

            <ProgramEditDialogs state={state} />
        </div>
    );
};
