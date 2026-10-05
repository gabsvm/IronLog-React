// T2: ExercisesView state, effects and handlers, moved verbatim from
// views/ExercisesView.tsx (the view is now an orchestrator).
import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useStore } from '../../lib/store';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../../components/ui/Icon';
import { MuscleGroup, ExerciseDef, VolumeCountingMode } from '../../types';
import { getTranslated } from '../../utils';
import { matchesExerciseQuery, mergeExercises, suggestDuplicatePairs, unmergeExercise } from '../../utils/exerciseLibrary';
import { triggerHaptic } from '../../utils/audio';
import { statsCache } from '../../services/statsCache';
import { analyzeExerciseReferences, archiveExercise, unarchiveExercise, deleteCustomExercise, isBuiltInExercise, executeExerciseReplacement, ExerciseReferenceReport } from '../../services/exerciseReferenceService';

export interface ExercisesViewProps {
    onBack: () => void;
}

export const useExercisesViewState = ({ onBack }: ExercisesViewProps) => {
    const { exercises, setExercises, lang, program, setProgram, personalTemplates, setPersonalTemplates } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const t = TRANSLATIONS[lang];
    const ev = t.exercisesView;

    const [mode, setMode] = useState<'list' | 'create'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'ALL'>('ALL');
    const [filterCategory, setFilterCategory] = useState<'all' | 'custom' | 'archived'>('all');

    // Detail Modal State
    const [detailEx, setDetailEx] = useState<ExerciseDef | null>(null);

    // Delete / Archive / Replace Modal State
    const [pendingDeleteReport, setPendingDeleteReport] = useState<ExerciseReferenceReport | null>(null);
    const [unreferencedDeleteId, setUnreferencedDeleteId] = useState<string | null>(null);
    const [replacingExerciseId, setReplacingExerciseId] = useState<string | null>(null);
    const [pendingReplacementCandidate, setPendingReplacementCandidate] = useState<ExerciseDef | null>(null);

    // Merge State (Q14): mergingExerciseId is the duplicate that folds into
    // mergeCandidate. Logs are never rewritten; reads resolve through the
    // pointer and caches are invalidated so charts recompute.
    const [mergingExerciseId, setMergingExerciseId] = useState<string | null>(null);
    const [mergeCandidate, setMergeCandidate] = useState<ExerciseDef | null>(null);

    // Create State
    const [newName, setNewName] = useState('');
    const [newMuscle, setNewMuscle] = useState<MuscleGroup>('CHEST');
    const [newVolumeCountingMode, setNewVolumeCountingMode] = useState<VolumeCountingMode>('total');

    const handleCreate = () => {
        if (!newName.trim()) return;
        const newEx: ExerciseDef = {
            id: `custom_${Date.now()}`,
            name: newName.trim(),
            muscle: newMuscle,
            volumeCountingMode: newVolumeCountingMode,
            isCustom: true,
        };
        setExercises(prev => [...prev, newEx]);
        setMode('list');
        setNewName('');
        triggerHaptic('success');
    };

    const handleInitiateDelete = (ex: ExerciseDef) => {
        if (isBuiltInExercise(ex.id, exercises)) {
            return;
        }

        const report = analyzeExerciseReferences(ex.id, {
            exercises,
            program,
            activeMeso,
            personalTemplates,
        });

        if (report.totalReferences > 0) {
            setPendingDeleteReport(report);
        } else {
            setUnreferencedDeleteId(ex.id);
        }
    };

    const handleConfirmPermanentDelete = () => {
        if (!unreferencedDeleteId) return;
        const result = deleteCustomExercise(exercises, unreferencedDeleteId);
        if (result.success) {
            setExercises(result.updatedExercises);
            triggerHaptic('medium');
        }
        setUnreferencedDeleteId(null);
    };

    const handleArchiveFromReport = (exId: string) => {
        setExercises(prev => archiveExercise(prev, exId));
        setPendingDeleteReport(null);
        triggerHaptic('medium');
    };

    const handleStartReplaceFlow = (exId: string) => {
        setReplacingExerciseId(exId);
        setPendingDeleteReport(null);
    };

    const handleExecuteReplacement = (oldExId: string, newExId: string) => {
        const result = executeExerciseReplacement({
            oldExerciseId: oldExId,
            newExerciseId: newExId,
            deleteOldExercise: true,
            exercises,
            program,
            activeMeso,
            personalTemplates,
        });

        setExercises(result.updatedExercises);
        setProgram(result.updatedProgram);
        if (result.updatedActiveMeso) {
            setActiveMeso(result.updatedActiveMeso);
        }
        setPersonalTemplates(result.updatedPersonalTemplates);

        setPendingReplacementCandidate(null);
        setReplacingExerciseId(null);
        triggerHaptic('success');
    };

    const handleUnarchive = (exId: string) => {
        setExercises(prev => unarchiveExercise(prev, exId));
        triggerHaptic('success');
    };

    const handleStartMerge = (exId: string) => {
        setMergingExerciseId(exId);
        setMergeCandidate(null);
    };

    const handleCancelMerge = () => {
        setMergingExerciseId(null);
        setMergeCandidate(null);
    };

    const handleConfirmMerge = () => {
        if (!mergingExerciseId || !mergeCandidate) return;
        setExercises(prev => mergeExercises(prev, mergingExerciseId, mergeCandidate.id));
        void statsCache.invalidateChartCache();
        setMergingExerciseId(null);
        setMergeCandidate(null);
        triggerHaptic('success');
    };

    const handleUnmerge = (exId: string) => {
        setExercises(prev => unmergeExercise(prev, exId));
        void statsCache.invalidateChartCache();
        triggerHaptic('success');
    };

    const duplicateSuggestions = useMemo(
        () => suggestDuplicatePairs(exercises).slice(0, 3),
        [exercises],
    );

    const filteredExercises = useMemo(() => {
        return exercises
            .filter(ex => {
                if (filterCategory === 'custom') {
                    return !isBuiltInExercise(ex.id, exercises);
                }
                if (filterCategory === 'archived') {
                    return !!ex.archived;
                }
                // 'all' includes active exercises (not archived by default, unless searching)
                if (!searchQuery.trim() && ex.archived) {
                    return false;
                }
                return true;
            })
            .filter(ex => {
                if (selectedMuscle !== 'ALL' && ex.muscle !== selectedMuscle) {
                    return false;
                }
                // Accent-insensitive search across names in both languages plus
                // library aliases (Q14).
                return matchesExerciseQuery(ex, searchQuery);
            })
            .sort((a, b) => {
                const na = getTranslated(a.name, lang);
                const nb = getTranslated(b.name, lang);
                return na.localeCompare(nb);
            });
    }, [exercises, filterCategory, selectedMuscle, searchQuery, lang]);

    const Row = (index: number, ex: ExerciseDef) => {
        const isBuiltIn = isBuiltInExercise(ex.id, exercises);
        const isArchived = !!ex.archived;
        const isMerged = !!ex.mergedInto;
        const mergeTargetName = isMerged
            ? getTranslated(exercises.find(e => e.id === ex.mergedInto)?.name ?? ex.mergedInto ?? '', lang)
            : '';

        return (
            <div className="px-4 py-1.5" key={ex.id}>
                <div className="w-full glass-card p-3 rounded-2xl flex items-center justify-between shadow-sm border border-zinc-200 dark:border-white/5 bg-white/70 dark:bg-zinc-900/70 hover:border-primary-500/30 transition-all">
                    {/* Main card button (no nested buttons inside!) */}
                    <button
                        type="button"
                        onClick={() => setDetailEx(ex)}
                        className="flex-1 min-w-0 text-left py-1 pr-2 flex flex-col justify-center focus:outline-none"
                        aria-label={`Detalles de ${getTranslated(ex.name, lang)}`}
                    >
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-zinc-900 dark:text-white text-sm truncate">
                                {getTranslated(ex.name, lang)}
                            </span>
                            {isArchived && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-500 border border-amber-500/30">
                                    {ev.badgeArchived}
                                </span>
                            )}
                            {!isBuiltIn && !isArchived && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-primary-500/20 text-primary-400 border border-primary-500/30">
                                    {ev.badgeCustom}
                                </span>
                            )}
                            {isMerged && (
                                <span
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-violet-500/20 text-violet-400 border border-violet-500/30"
                                    title={t.merge.mergedInto.replace('{target}', String(mergeTargetName))}
                                >
                                    {t.merge.badge}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400">
                                {TRANSLATIONS[lang].muscle[ex.muscle]}
                            </span>
                            {ex.volumeCountingMode === 'per_side' && (
                                <span className="text-[10px] text-zinc-400 font-medium">×2</span>
                            )}
                        </div>
                    </button>

                    {/* Action buttons (Cleanly adjacent, NOT nested) */}
                    <div className="flex items-center gap-1 shrink-0">
                        {isArchived ? (
                            <button
                                type="button"
                                onClick={() => handleUnarchive(ex.id)}
                                className="p-2 text-zinc-400 hover:text-primary-400 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                title={ev.unarchive}
                                aria-label={ev.unarchive}
                            >
                                <Icon name="ArchiveRestore" size={18} />
                            </button>
                        ) : null}

                        {!isBuiltIn ? (
                            <button
                                type="button"
                                onClick={() => handleInitiateDelete(ex)}
                                className="p-2 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                                title={ev.deleteArchive}
                                aria-label={ev.deleteEx}
                            >
                                <Icon name="Trash2" size={18} />
                            </button>
                        ) : (
                            <div className="p-2 text-zinc-300 dark:text-zinc-600" title={ev.officialCatalog}>
                                <Icon name="Lock" size={16} />
                            </div>
                        )}

                        {isMerged ? (
                            <button
                                type="button"
                                onClick={() => handleUnmerge(ex.id)}
                                className="p-2 text-zinc-400 hover:text-violet-400 transition-colors rounded-lg hover:bg-violet-500/10"
                                title={t.merge.unmerge}
                                aria-label={`${t.merge.unmerge}: ${getTranslated(ex.name, lang)}`}
                            >
                                <Icon name="Unlink" size={18} />
                            </button>
                        ) : !isArchived ? (
                            <button
                                type="button"
                                onClick={() => handleStartMerge(ex.id)}
                                className="p-2 text-zinc-400 hover:text-violet-400 transition-colors rounded-lg hover:bg-violet-500/10"
                                title={t.merge.button}
                                aria-label={`${t.merge.button}: ${getTranslated(ex.name, lang)}`}
                            >
                                <Icon name="Link" size={18} />
                            </button>
                        ) : null}

                        <button
                            type="button"
                            onClick={() => setDetailEx(ex)}
                            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                            aria-label="Ver detalles"
                        >
                            <Icon name="ChevronRight" size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };


    return {
        onBack,
        exercises,
        setExercises,
        lang,
        program,
        setProgram,
        personalTemplates,
        setPersonalTemplates,
        activeMeso,
        setActiveMeso,
        t,
        ev,
        mode,
        setMode,
        searchQuery,
        setSearchQuery,
        selectedMuscle,
        setSelectedMuscle,
        filterCategory,
        setFilterCategory,
        detailEx,
        setDetailEx,
        pendingDeleteReport,
        setPendingDeleteReport,
        unreferencedDeleteId,
        setUnreferencedDeleteId,
        replacingExerciseId,
        setReplacingExerciseId,
        pendingReplacementCandidate,
        setPendingReplacementCandidate,
        mergingExerciseId,
        setMergingExerciseId,
        mergeCandidate,
        setMergeCandidate,
        newName,
        setNewName,
        newMuscle,
        setNewMuscle,
        newVolumeCountingMode,
        setNewVolumeCountingMode,
        handleCreate,
        handleInitiateDelete,
        handleConfirmPermanentDelete,
        handleArchiveFromReport,
        handleStartReplaceFlow,
        handleExecuteReplacement,
        handleUnarchive,
        handleStartMerge,
        handleCancelMerge,
        handleConfirmMerge,
        handleUnmerge,
        duplicateSuggestions,
        filteredExercises,
        Row,
    };
};

export type ExercisesViewState = ReturnType<typeof useExercisesViewState>;
