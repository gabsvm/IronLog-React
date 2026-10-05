// T2: CrossFit WOD picker, moved verbatim from components/workout/FreestyleSessionModal.tsx.
import React from 'react';
import { Icon } from '../../ui/Icon';
import { CF_WODS } from './freestyleData';
import type { FreestyleSessionState } from './useFreestyleSessionState';

export const FreestyleWodPanel: React.FC<{ state: FreestyleSessionState }> = ({ state }) => {
    const { discipline, selectedWodId, setSelectedWodId, f, handleStartBlank } = state;
    return (
        <>
            {discipline === 'crossfit' && (
                <div className="space-y-3">
                    {/* Blank CrossFit option */}
                    <button
                        onClick={() => handleStartBlank(f.blankCf)}
                        className="w-full text-left p-4 rounded-2xl border-2 border-dashed border-primary-500/40 bg-primary-500/5 hover:border-primary-500/60 transition-all active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary-500/20 flex items-center justify-center shrink-0">
                                <Icon name="Plus" size={18} className="text-primary-400" />
                            </div>
                            <div>
                                <p className="font-black text-sm text-primary-400">
                                    {f.openSession}
                                </p>
                                <p className="text-xs text-muted mt-0.5">
                                    {f.noTemplate}
                                </p>
                            </div>
                        </div>
                    </button>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        {f.wodsTitle}
                    </p>
                    {CF_WODS.map(wod => (
                        <button
                            key={wod.id}
                            onClick={() => setSelectedWodId(wod.id === selectedWodId ? null : wod.id)}
                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                                selectedWodId === wod.id
                                    ? 'border-primary-500 bg-primary-500/5'
                                    : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-white/20'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 font-black ${
                                    selectedWodId === wod.id ? 'bg-primary-500 text-black' : 'bg-zinc-100 dark:bg-zinc-800'
                                }`}>
                                    {wod.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`font-black text-sm ${selectedWodId === wod.id ? 'text-primary-700 dark:text-primary-400' : 'text-zinc-900 dark:text-white'}`}>
                                        {wod.name}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 mt-0.5 font-medium">{wod.description}</div>
                                    <div className={`text-[9px] font-black uppercase tracking-wider mt-1 ${selectedWodId === wod.id ? 'text-primary-500' : 'text-zinc-300 dark:text-zinc-600'}`}>
                                        {wod.schema}
                                    </div>
                                </div>
                                {selectedWodId === wod.id && (
                                    <Icon name="Check" size={16} className="text-primary-500 flex-shrink-0 mt-1" />
                                )}
                            </div>
                        </button>
                    ))}
                    <p className="text-[10px] text-zinc-400 text-center pt-1">
                        {f.extraNote}
                    </p>
                </div>
            )}
        </>
    );
};
