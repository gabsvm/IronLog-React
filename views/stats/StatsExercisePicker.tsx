// S6: exercise picker sheet, moved verbatim from views/StatsViewImpl.tsx.
import React from 'react';
import { TRANSLATIONS } from '../../constants';
import { getTranslated } from '../../utils';
import { pickLang } from '../../utils/i18n';
import { Icon } from '../../components/ui/Icon';
import type { StatsData } from './useStatsData';

export const StatsExercisePicker: React.FC<{ stats: StatsData }> = ({ stats }) => {
    const { lang, t, s, selectedExId, setSelectedExId, setShowPicker, pickerSearch, setPickerSearch, filteredExercises } = stats;

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowPicker(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setShowPicker]);

    return (
        <>
                <div className="fixed inset-0 z-sheet flex flex-col bg-surface-app animate-in slide-in-from-bottom duration-200">
                    <div className="flex min-h-14 pt-safe shrink-0 items-center gap-3 border-b border-border-subtle bg-surface-base px-3">
                        <button
                            onClick={() => setShowPicker(false)}
                            className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-border-subtle bg-surface-raised text-zinc-400 hover:text-white active:scale-95"
                            aria-label={pickLang(lang, { es: 'Cerrar', en: 'Close' })}
                        >
                            <Icon name="X" size={18} />
                        </button>
                        <div className="relative flex-1">
                            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="text"
                                placeholder={t.searchPlaceholder}
                                className="w-full rounded-[6px] border border-border-subtle bg-surface-raised py-2 pl-9 pr-3 text-xs font-medium text-white outline-none placeholder-zinc-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
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
                                    className={`group flex w-full items-center justify-between rounded-[6px] border p-2.5 text-left transition-all active:scale-[0.99] ${
                                        selectedExId === String(ex.id)
                                            ? 'border-primary-500/40 bg-primary-500/10'
                                            : 'border-transparent hover:bg-white/5'
                                    }`}
                                >
                                    <div>
                                        <div className={`text-sm font-black uppercase tracking-tight ${selectedExId === String(ex.id) ? 'text-primary-400' : 'text-white'}`}>
                                            {getTranslated(ex.name, lang)}
                                        </div>
                                        <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
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
