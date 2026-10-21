// T2: ExercisesView state, effects and handlers, moved verbatim from
// views/ExercisesView.tsx (the view is now an orchestrator).
import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useStore } from '../../lib/store';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../../components/ui/Icon';
import { MuscleGroup, ExerciseDef, VolumeCountingMode } from '../../types';
import { getTranslated } from '../../utils';
import { pickLang } from '../../utils/i18n';
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

    const Row = (_index: number, ex: ExerciseDef) => {
        const isBuiltIn = isBuiltInExercise(ex.id, exercises);
        const isArchived = !!ex.archived;
        const isMerged = !!ex.mergedInto;
        const mergeTargetName = isMerged
            ? getTranslated(exercises.find(e => e.id === ex.mergedInto)?.name ?? ex.mergedInto ?? '', lang)
            : '';

        return (
            <div className="px-4 py-1.5" key={ex.id}>
                <div className="gl-panel flex w-full items-center justify-between p-3 shadow-sm">
                    {/* Main card button (no nested buttons inside!) */}
                    <button
                        type="button"
                        onClick={() => setDetailEx(ex)}
                        className="flex-1 min-w-0 text-left py-1 pr-2 flex flex-col justify-center focus:outline-none"
                        aria-label={pickLang(lang, { es: `Detalles de ${getTranslated(ex.name, lang)}`, en: `Details of ${getTranslated(ex.name, lang)}` })}
                    >
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="truncate text-sm font-bold text-[rgb(var(--text-primary))]">
                                {getTranslated(ex.name, lang)}
                            </span>
                            {isArchived && (
                                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs font-bold uppercase text-amber-500">
                                    {ev.badgeArchived}
                                </span>
                            )}
                            {!isBuiltIn && !isArchived && (
                                <span className="rounded bg-primary-500/20 px-1.5 py-0.5 text-xs font-bold uppercase text-primary-500">
                                    {ev.badgeCustom}
                                </span>
                            )}
                            {isMerged && (
                                <span
                                    className="rounded bg-violet-500/20 px-1.5 py-0.5 text-xs font-bold uppercase text-violet-400"
                                    title={t.merge.mergedInto.replace('{target}', String(mergeTargetName))}
                                >
                                    {t.merge.badge}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="rounded bg-[rgb(var(--surface-elevated))] px-1.5 py-0.5 text-xs font-bold uppercase text-muted">
                                {TRANSLATIONS[lang].muscle[ex.muscle]}
                            </span>
                            {ex.volumeCountingMode === 'per_side' && (
                                <span className="text-xs font-medium text-muted">×2</span>
                            )}
                        </div>
                    </button>

                    {/* Action buttons (Cleanly adjacent, NOT nested) */}
                    <div className="flex items-center gap-1 shrink-0">
                        {isArchived ? (
                            <button
                                type="button"
                                onClick={() => handleUnarchive(ex.id)}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted transition-colors hover:bg-[rgb(var(--surface-elevated))] hover:text-primary-500"
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
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                                title={ev.deleteArchive}
                                aria-label={ev.deleteEx}
                            >
                                <Icon name="Trash2" size={18} />
                            </button>
                        ) : (
                            <div className="flex min-h-[44px] min-w-[44px] items-center justify-center text-muted" title={ev.officialCatalog}>
                                <Icon name="Lock" size={16} />
                            </div>
                        )}

                        {isMerged ? (
                            <button
                                type="button"
                                onClick={() => handleUnmerge(ex.id)}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted transition-colors hover:bg-violet-500/10 hover:text-violet-400"
                                title={t.merge.unmerge}
                                aria-label={`${t.merge.unmerge}: ${getTranslated(ex.name, lang)}`}
                            >
                                <Icon name="Unlink" size={18} />
                            </button>
                        ) : !isArchived ? (
                            <button
                                type="button"
                                onClick={() => handleStartMerge(ex.id)}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted transition-colors hover:bg-violet-500/10 hover:text-violet-400"
                                title={t.merge.button}
                                aria-label={`${t.merge.button}: ${getTranslated(ex.name, lang)}`}
                            >
                                <Icon name="Link" size={18} />
                            </button>
                        ) : null}

                        <button
                            type="button"
                            onClick={() => setDetailEx(ex)}
                            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted transition-colors hover:text-[rgb(var(--text-primary))]"
                            aria-label={pickLang(lang, { es: 'Ver detalles', en: 'View details' })}
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
