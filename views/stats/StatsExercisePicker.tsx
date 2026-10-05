// S6: exercise picker sheet, moved verbatim from views/StatsViewImpl.tsx.
import React from 'react';
import { TRANSLATIONS } from '../../constants';
import { getTranslated } from '../../utils';
import { Icon } from '../../components/ui/Icon';
import type { StatsData } from './useStatsData';

export const StatsExercisePicker: React.FC<{ stats: StatsData }> = ({ stats }) => {
    const { lang, t, s, selectedExId, setSelectedExId, setShowPicker, pickerSearch, setPickerSearch, filteredExercises } = stats;
    return (
        <>
                <div className="fixed inset-0 z-sheet flex flex-col bg-zinc-950 animate-in slide-in-from-bottom duration-200">
                    <div className="glass flex min-h-16 pt-safe shrink-0 items-center gap-3 border-b border-white/5 px-4">
                        <button onClick={() => setShowPicker(false)} className="-ml-2 p-2 text-zinc-400 hover:text-white">
                            <Icon name="X" size={24} />
                        </button>
                        <div className="relative flex-1">
                            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder={t.searchPlaceholder}
                                className="glow-input-neon w-full rounded-xl border border-zinc-700/50 bg-zinc-800/50 py-2 pl-9 pr-4 text-sm font-medium text-white outline-none transition-all placeholder-zinc-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                value={pickerSearch}
                                onChange={event => setPickerSearch(event.target.value)}
                            />
                        </div>
                    </div>

                    <div className="scroll-container flex-1 overflow-y-auto p-2 pb-[calc(0.5rem+var(--safe-area-bottom))]">
                        <div className="space-y-1">
                            {filteredExercises.map(ex => (
                                <button
                                    key={ex.id}
                                    onClick={() => {
                                        setSelectedExId(String(ex.id));
                                        setShowPicker(false);
                                    }}
                                    className={`group flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all active:scale-[0.99] ${
                                        selectedExId === String(ex.id)
                                            ? 'border-primary-500/30 bg-primary-500/10'
                                            : 'border-transparent hover:bg-white/5'
                                    }`}
                                >
                                    <div>
                                        <div className={`text-sm font-bold ${selectedExId === String(ex.id) ? 'text-primary-400' : 'text-zinc-100'}`}>
                                            {getTranslated(ex.name, lang)}
                                        </div>
                                        <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                                            {TRANSLATIONS[lang].muscle[ex.muscle]}
                                        </div>
                                    </div>
                                    {selectedExId === String(ex.id) && (
                                        <div className="text-primary-500">
                                            <Icon name="Check" size={18} />
                                        </div>
                                    )}
                                </button>
                            ))}

                            {filteredExercises.length === 0 && (
                                <div className="py-10 text-center text-xs text-zinc-400">
                                    {`${s.noMatch} "${pickerSearch}".`}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
        </>
    );
};
