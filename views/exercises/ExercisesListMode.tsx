// T2: library list mode (search, filters, virtual list), moved verbatim from views/ExercisesView.tsx.
import React from 'react';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../../constants';
import { Icon } from '../../components/ui/Icon';
import { getTranslated } from '../../utils';
import { pickLang } from '../../utils/i18n';
import { Virtuoso } from 'react-virtuoso';
import type { ExercisesViewState } from './useExercisesViewState';

const VirtuosoFooter = () => <div style={{ height: 'calc(5rem + var(--safe-area-bottom))' }} />;
const VIRTUOSO_COMPONENTS = { Footer: VirtuosoFooter };

export const ExercisesListMode: React.FC<{ state: ExercisesViewState }> = ({ state }) => {
    const { exercises, lang, t, ev, setMode, searchQuery, setSearchQuery, selectedMuscle, setSelectedMuscle, filterCategory, setFilterCategory, setMergingExerciseId, setMergeCandidate, duplicateSuggestions, filteredExercises, Row } = state;
    return (
        <>
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Controls: Search and Filter Chips */}
                    <div className="sticky top-0 z-20 shrink-0 space-y-3 border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base)/0.95)] p-4 backdrop-blur-md">
                        {/* Search input */}
                        <div className="relative">
                            <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={ev.searchPh}
                                className="premium-form-input w-full py-3 pl-10 pr-9 font-medium"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                                    aria-label={pickLang(lang, { es: 'Limpiar búsqueda', en: 'Clear search' })}
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
                                    className={`premium-filter-pill ${
                                        filterCategory === cat
                                            ? 'bg-primary-500 text-black shadow-sm'
                                            : 'bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-secondary))]'
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
                                className={`premium-filter-pill shrink-0 whitespace-nowrap ${
                                    selectedMuscle === 'ALL'
                                        ? 'bg-primary-500 text-zinc-950'
                                        : 'bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-secondary))]'
                                }`}
                            >
                                {ev.allMuscles}
                            </button>
                            {Object.values(MUSCLE_GROUPS).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setSelectedMuscle(m)}
                                    className={`premium-filter-pill shrink-0 whitespace-nowrap ${
                                        selectedMuscle === m
                                            ? 'bg-primary-500/20 text-primary-400 border border-primary-500/40'
                                            : 'bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-secondary))]'
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
                            <p className="text-xs font-semibold text-muted">
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
                                components={VIRTUOSO_COMPONENTS}
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
