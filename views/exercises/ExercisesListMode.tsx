// T2: library list mode (search, filters, virtual list), moved verbatim from views/ExercisesView.tsx.
import React from 'react';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../../constants';
import { Icon } from '../../components/ui/Icon';
import { getTranslated } from '../../utils';
import { Virtuoso } from 'react-virtuoso';
import type { ExercisesViewState } from './useExercisesViewState';

export const ExercisesListMode: React.FC<{ state: ExercisesViewState }> = ({ state }) => {
    const { exercises, lang, t, ev, setMode, searchQuery, setSearchQuery, selectedMuscle, setSelectedMuscle, filterCategory, setFilterCategory, setMergingExerciseId, setMergeCandidate, duplicateSuggestions, filteredExercises, Row } = state;
    return (
        <>
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Controls: Search and Filter Chips */}
                    <div className="p-4 space-y-3 shrink-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-b border-zinc-200 dark:border-white/5">
                        {/* Search input */}
                        <div className="relative">
                            <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={ev.searchPh}
                                className="w-full pl-9 pr-8 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm font-medium text-zinc-900 dark:text-white border border-transparent focus:border-primary-500 outline-none transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                                    aria-label="Limpiar búsqueda"
                                >
                                    <Icon name="X" size={14} />
                                </button>
                            )}
                        </div>

                        {/* Category filter tabs */}
                        <div className="flex gap-2">
                            {(['all', 'custom', 'archived'] as const).map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setFilterCategory(cat)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        filterCategory === cat
                                            ? 'bg-primary-500 text-black shadow-sm'
                                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    {cat === 'all'
                                        ? ev.filterAll
                                        : cat === 'custom'
                                        ? ev.filterCustom
                                        : ev.filterArchived}
                                </button>
                            ))}
                        </div>

                        {/* Muscle filter horizontal scroll */}
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                            <button
                                onClick={() => setSelectedMuscle('ALL')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors ${
                                    selectedMuscle === 'ALL'
                                        ? 'bg-zinc-800 dark:bg-white text-white dark:text-black'
                                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                                }`}
                            >
                                {ev.allMuscles}
                            </button>
                            {Object.values(MUSCLE_GROUPS).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setSelectedMuscle(m)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors ${
                                        selectedMuscle === m
                                            ? 'bg-primary-500/20 text-primary-400 border border-primary-500/40'
                                            : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                                    }`}
                                >
                                    {TRANSLATIONS[lang].muscle[m]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duplicate suggestions (Q14) */}
                    {duplicateSuggestions.length > 0 && (
                        <div className="shrink-0 px-4 pt-3 space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                                {t.merge.suggestionsTitle}
                            </p>
                            {duplicateSuggestions.map(s => {
                                const source = exercises.find(e => e.id === s.sourceId);
                                const target = exercises.find(e => e.id === s.targetId);
                                if (!source || !target) return null;
                                return (
                                    <div
                                        key={`${s.sourceId}>${s.targetId}`}
                                        className="flex items-center justify-between gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-bold text-zinc-900 dark:text-white">
                                                {getTranslated(source.name, lang)}
                                                <span className="mx-1 text-violet-400">→</span>
                                                {getTranslated(target.name, lang)}
                                            </p>
                                            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                                                {s.reason === 'same-name' ? t.merge.reasonSameName : t.merge.reasonSharedAlias}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMergingExerciseId(source.id);
                                                setMergeCandidate(target);
                                            }}
                                            className="shrink-0 rounded-lg bg-violet-500/20 px-3 py-1.5 text-xs font-bold text-violet-300 hover:bg-violet-500/30"
                                            aria-label={`${t.merge.confirmAction}: ${getTranslated(source.name, lang)} → ${getTranslated(target.name, lang)}`}
                                        >
                                            {t.merge.confirmAction}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* List */}
                    <div className="flex-1 overflow-hidden relative">
                        {filteredExercises.length === 0 ? (
                            <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                                <Icon name="Dumbbell" size={32} className="mb-2 opacity-40" />
                                <p className="text-sm font-medium">
                                    {ev.noResults}
                                </p>
                            </div>
                        ) : (
                            <Virtuoso
                                style={{ height: '100%' }}
                                data={filteredExercises}
                                itemContent={Row}
                                components={{
                                    Footer: () => <div className="h-[calc(6rem+var(--safe-area-bottom))]" /> // Padding for FAB
                                }}
                            />
                        )}

                        <div className="fixed bottom-[calc(1.5rem+var(--safe-area-bottom))] right-6 z-10">
                            <button
                                onClick={() => setMode('create')}
                                className="w-14 h-14 bg-primary-500 rounded-full text-black shadow-xl shadow-primary-500/25 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                                aria-label={ev.createEx}
                            >
                                <Icon name="Plus" size={24} />
                            </button>
                        </div>
                    </div>
                </div>
        </>
    );
};
