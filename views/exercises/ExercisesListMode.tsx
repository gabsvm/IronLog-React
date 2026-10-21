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
                    <div className="shrink-0 space-y-3 border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base)/0.95)] p-4 backdrop-blur-md">
                        {/* Search input */}
                        <div className="relative">
                            <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={ev.searchPh}
                                className="gl-input py-2 pl-10 pr-9 font-medium"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:text-[rgb(var(--text-primary))]"
                                    aria-label={pickLang(lang, { es: 'Limpiar búsqueda', en: 'Clear search' })}
                                >
                                    <Icon name="X" size={14} />
                                </button>
                            )}
                        </div>

                        {/* Category filter tabs */}
                        <div className="flex gap-2" role="group" aria-label={ev.filterAll}>
                            {(['all', 'custom', 'archived'] as const).map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setFilterCategory(cat)}
                                    aria-pressed={filterCategory === cat}
                                    className={`min-h-[44px] rounded-full px-4 text-xs font-bold transition-colors ${
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
                                aria-pressed={selectedMuscle === 'ALL'}
                                className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-full px-4 text-xs font-bold transition-colors ${
                                    selectedMuscle === 'ALL'
                                        ? 'bg-primary-500 text-black shadow-sm'
                                        : 'bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-secondary))]'
                                }`}
                            >
                                {ev.allMuscles}
                            </button>
                            {Object.values(MUSCLE_GROUPS).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setSelectedMuscle(m)}
                                    className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-full px-4 text-xs font-bold transition-colors ${
                                        selectedMuscle === m
                                            ? 'border border-primary-500/40 bg-primary-500/20 text-primary-500'
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
                                            <p className="truncate text-xs font-bold text-[rgb(var(--text-primary))]">
                                                {getTranslated(source.name, lang)}
                                                <span className="mx-1 text-violet-400">→</span>
                                                {getTranslated(target.name, lang)}
                                            </p>
                                            <p className="text-xs font-medium uppercase tracking-wide text-muted">
                                                {s.reason === 'same-name' ? t.merge.reasonSameName : t.merge.reasonSharedAlias}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMergingExerciseId(source.id);
                                                setMergeCandidate(target);
                                            }}
                                            className="min-h-[44px] shrink-0 rounded-lg bg-violet-500/20 px-4 text-xs font-bold text-violet-400 hover:bg-violet-500/30"
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
                            <div className="flex h-48 flex-col items-center justify-center p-6 text-center text-muted">
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
                                className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-black shadow-xl shadow-primary-500/25 transition-all hover:scale-105 active:scale-95"
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
