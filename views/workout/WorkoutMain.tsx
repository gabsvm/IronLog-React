// S6: header + exercise list, upgraded to 1:1 RP Training Day (progress bar, grouped ⋮ menu, muscle priorities & sheets).
import React, { Suspense, useState, useMemo } from 'react';
import { Icon } from '../../components/ui/Icon';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import { SortableExerciseCard } from '../../components/workout/SortableExerciseCard';
import { WorkoutTimer } from '../../components/workout/WorkoutTimer';
import { useStore } from '../../lib/store';
import { useTimerState } from '../../context/TimerContext';
import { pickLang } from '../../utils/i18n';
import { resolveMuscleLabel } from '../../utils/muscle';
import { fromDisplay, resolveWeightUnit, toDisplay, unitLabel } from '../../utils/units';
import { countWorkingSets } from '../../utils/workoutProgress';
import {
    applyRecoverySessionToExercise,
    detectConsecutiveMissesAndEarlyDeload,
    getTargetRirForWeek,
    isRetrospectiveSorenessDue,
} from '../../utils/rpAutoregulation';
import type { MuscleGroup, MusclePriorityLevel, SessionExercise } from '../../types';
import type { WorkoutViewState } from './useWorkoutViewState';

const WorkoutSortableList = React.lazy(() => import('../../components/workout/WorkoutSortableList'));
const MusclePrioritiesSheet = React.lazy(() =>
    import('../../components/workout/MusclePrioritiesSheet').then(m => ({ default: m.MusclePrioritiesSheet }))
);
const DeloadRecoveryCard = React.lazy(() =>
    import('../../components/workout/DeloadRecoveryCard').then(m => ({ default: m.DeloadRecoveryCard }))
);
const BadSessionTriageSheet = React.lazy(() =>
    import('../../components/workout/DeloadRecoveryCard').then(m => ({ default: m.BadSessionTriageSheet }))
);

type SubSheetType = 'mesoNotes' | 'renameMeso' | 'mesoSummary' | 'workoutNote' | 'relabelDay' | 'bodyweight' | 'endMesoConfirm' | null;

export const WorkoutMain: React.FC<{ state: WorkoutViewState }> = ({ state }) => {
    const {
        onBack, onOpenReorder, sessionExercises, openMenuId, setOpenMenuId,
        setShowFinishModal, setReplacingExId, setAddingExercise, linkingId, setLinkingId,
        setEditingMuscleId, setWarmupExId, setDetailExercise, handleSetUpdate, handleAddSet,
        handleDeleteSet, updateSession, exercises, logs, lang, config, activeSession,
        t, w, stageConfig, isCalisthenicsSession, supersetColorIndexes, handleSetTypeChange,
        sortableItems, activeExerciseId, handleToggleExpand, handleSetComplete, handleReorder,
        ctrl, handlePinNoteToLibrary, handleQuickBodyweightUpdate, handleSwapExerciseOrder, userBodyWeight,
    } = state;

    const activeMeso = useStore(state => state.activeMeso);
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const restTimer = useTimerState();
    const [showCalendarDrawer, setShowCalendarDrawer] = useState(false);
    const [showSessionMenu, setShowSessionMenu] = useState(false);
    const [showPrioritiesSheet, setShowPrioritiesSheet] = useState(false);
    const [showBadSessionSheet, setShowBadSessionSheet] = useState(false);
    const [activeSubSheet, setActiveSubSheet] = useState<SubSheetType>(null);
    const [draftText, setDraftText] = useState('');
    const [earlyDeloadDismissed, setEarlyDeloadDismissed] = useState(false);

    const earlyDeloadStatus = useMemo(
        () => detectConsecutiveMissesAndEarlyDeload(logs, activeMeso),
        [logs, activeMeso]
    );

    const workoutProgressPct = useMemo(() => {
        if (typeof state.progressPct === 'number') return state.progressPct;
        return countWorkingSets(sessionExercises).progressPct;
    }, [state.progressPct, sessionExercises]);

    const mesoMuscles = useMemo(() => {
        const set = new Set<MuscleGroup>();
        for (const ex of sessionExercises) {
            if (ex?.muscle && ex.muscle !== 'CARDIO') set.add(ex.muscle);
        }
        return Array.from(set);
    }, [sessionExercises]);

    const mesoSummaryStats = useMemo(() => {
        if (!activeMeso) return { sessions: 0, totalSets: 0 };
        const mesoLogs = (logs || []).filter(l => l.mesoId === activeMeso.id && !l.skipped);
        const totalSets = mesoLogs.reduce(
            (sum, log) => sum + (log.exercises || []).reduce((exSum, e) => exSum + (e.sets || []).filter(s => s.completed).length, 0),
            0
        );
        return { sessions: mesoLogs.length, totalSets };
    }, [activeMeso, logs]);

    if (!activeSession) return null;

    const dayName = isCalisthenicsSession
        ? t.calisthenicsSession
        : (activeSession.week >= 1
            ? activeSession.name.replace(new RegExp(`^${activeSession.week}\\s*[•·-]\\s*`), '')
            : activeSession.name);

    const mesoTitle = (activeMeso as any)?.title || activeMeso?.name || '';
    const totalWeeks = activeMeso?.targetWeeks || activeMeso?.duration || 1;
    const calendarAria = pickLang(lang, { es: 'Semanas y días', en: 'Weeks and days' });
    const unit = resolveWeightUnit(config);
    const unitLbl = unitLabel(unit);

    const openSubSheet = (type: SubSheetType, initial = '') => {
        setShowSessionMenu(false);
        setDraftText(initial);
        setActiveSubSheet(type);
    };

    const handleSaveSubSheet = () => {
        if (activeSubSheet === 'mesoNotes' && setActiveMeso) {
            setActiveMeso(prev => prev ? { ...prev, note: draftText } : prev);
        } else if (activeSubSheet === 'renameMeso' && setActiveMeso && draftText.trim()) {
            setActiveMeso(prev => prev ? { ...prev, name: draftText.trim() } : prev);
        } else if (activeSubSheet === 'workoutNote') {
            updateSession(prev => prev ? { ...prev, note: draftText } : prev);
        } else if (activeSubSheet === 'relabelDay' && draftText.trim()) {
            updateSession(prev => prev ? { ...prev, name: draftText.trim() } : prev);
        } else if (activeSubSheet === 'bodyweight') {
            const num = Number(draftText);
            if (Number.isFinite(num) && num > 0) {
                const kg = fromDisplay(num, unit);
                handleQuickBodyweightUpdate?.(kg);
            }
        }
        setActiveSubSheet(null);
    };

    return (
        <>
            {/* Accessible back button for test runners */}
            {onBack && (
                <button type="button" onClick={onBack} aria-label={t.back} className="sr-only">
                    {t.back}
                </button>
            )}

            {/* --- 1:1 RP Sticky Top Header --- */}
            <div className="relative z-30 border-b border-border-subtle pt-safe bg-surface-app">
                {/* Row 1 */}
                <div className="flex items-center justify-between gap-2 px-4 pt-2.5 pb-1">
                    {/* Left side: Meso overline + WEEK X DAY Y */}
                    <div className="min-w-0 flex-1">
                        {mesoTitle && (
                            <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-zinc-400 truncate leading-tight">
                                {mesoTitle}{dayName ? ` · ${dayName}` : ''}
                            </div>
                        )}
                        <div className="flex items-center whitespace-nowrap min-w-0">
                            {(activeSession as any).isFreestyle ? (
                                <span className="text-[19px] sm:text-[22px] font-black uppercase tracking-tight text-white">FREESTYLE</span>
                            ) : (
                                <>
                                    <span className="text-[19px] sm:text-[22px] font-black uppercase tracking-tight text-white">
                                        {pickLang(lang, { es: 'SEMANA', en: 'WEEK' })} {activeSession.week}
                                    </span>
                                    <span className="text-[19px] sm:text-[22px] font-black uppercase tracking-tight text-zinc-500 ml-1.5">
                                        {pickLang(lang, { es: 'DÍA', en: 'DAY' })} {(activeSession.dayIdx ?? 0) + 1}
                                    </span>
                                    <span
                                        data-testid="week-rir-pill"
                                        className={`ml-2 inline-flex items-center rounded-[4px] border px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider ${
                                            activeMeso?.isDeload
                                                ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                                                : 'border-primary-500/35 bg-primary-500/12 text-primary-300'
                                        }`}
                                    >
                                        {activeMeso?.isDeload
                                            ? 'DELOAD · 5 RIR'
                                            : `W${activeSession.week} · ${getTargetRirForWeek(activeSession.week, totalWeeks, Boolean(activeMeso?.isDeload))} RIR`}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {/* Calendar button */}
                        <button
                            type="button"
                            onClick={() => setShowCalendarDrawer(true)}
                            aria-label={calendarAria}
                            title={calendarAria}
                            className="relative flex h-8 w-8 items-center justify-center rounded-[4px] text-zinc-400 hover:text-white hover:bg-surface-raised active:scale-95 transition-all"
                        >
                            <Icon name="Calendar" size={19} />
                        </button>

                        {/* Finish Check / Button */}
                        <button
                            id="tut-finish-btn"
                            data-testid="workout-finish-btn"
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowFinishModal(true);
                            }}
                            className="relative flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] bg-primary-500 px-3 py-1.5 text-xs font-bold text-zinc-950 transition-all hover:bg-primary-400 active:scale-95 shadow-sm"
                        >
                            <Icon name="Check" size={14} strokeWidth={3} />
                            <span>{t.finish}</span>
                        </button>

                        {/* More options menu (2-section RP layout) */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowSessionMenu(prev => !prev);
                                }}
                                aria-label={(w as any)?.sessionOptionsAria || pickLang(lang, { es: 'Opciones de sesión', en: 'Session options' })}
                                className="relative flex h-8 w-8 items-center justify-center rounded-[4px] text-zinc-400 hover:text-white hover:bg-surface-raised active:scale-95 transition-all"
                            >
                                <Icon name="MoreVertical" size={18} />
                            </button>
                            {showSessionMenu && (
                                <div
                                    className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border border-border-subtle bg-surface-base p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {activeMeso && (
                                        <>
                                            <div className="px-3 pt-1.5 pb-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
                                                {pickLang(lang, { es: 'MESOCICLO', en: 'MESOCYCLE' })}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => openSubSheet('mesoNotes', activeMeso.note || '')}
                                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-surface-raised hover:text-white transition-colors"
                                            >
                                                <Icon name="FileText" size={14} className="text-zinc-400" />
                                                <span>{pickLang(lang, { es: 'Ver notas', en: 'View notes' })}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openSubSheet('renameMeso', mesoTitle)}
                                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-surface-raised hover:text-white transition-colors"
                                            >
                                                <Icon name="Edit3" size={14} className="text-zinc-400" />
                                                <span>{pickLang(lang, { es: 'Renombrar ciclo', en: 'Rename' })}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowSessionMenu(false);
                                                    setShowPrioritiesSheet(true);
                                                }}
                                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-surface-raised hover:text-white transition-colors"
                                            >
                                                <Icon name="SlidersHorizontal" size={14} className="text-emerald-400" />
                                                <span>{pickLang(lang, { es: 'Prioridades musculares', en: 'Muscle priorities' })}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openSubSheet('mesoSummary')}
                                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-surface-raised hover:text-white transition-colors"
                                            >
                                                <Icon name="BarChart2" size={14} className="text-zinc-400" />
                                                <span>{pickLang(lang, { es: 'Resumen del ciclo', en: 'Summary' })}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openSubSheet('endMesoConfirm')}
                                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/10 transition-colors"
                                            >
                                                <Icon name="Flag" size={14} />
                                                <span>{pickLang(lang, { es: 'Finalizar mesociclo', en: 'End meso' })}</span>
                                            </button>
                                            <div className="my-1 border-t border-border-subtle/50" />
                                        </>
                                    )}

                                    <div className="px-3 pt-1.5 pb-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
                                        {pickLang(lang, { es: 'ENTRENAMIENTO', en: 'WORKOUT' })}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openSubSheet('workoutNote', activeSession.note || '')}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-surface-raised hover:text-white transition-colors"
                                    >
                                        <Icon name="MessageSquare" size={14} className="text-zinc-400" />
                                        <span>{pickLang(lang, { es: 'Nota de sesión', en: 'New note' })}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openSubSheet('relabelDay', dayName)}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-surface-raised hover:text-white transition-colors"
                                    >
                                        <Icon name="Tag" size={14} className="text-zinc-400" />
                                        <span>{pickLang(lang, { es: 'Renombrar día', en: 'Relabel' })}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowSessionMenu(false);
                                            setAddingExercise(true);
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-surface-raised hover:text-white transition-colors"
                                    >
                                        <Icon name="Plus" size={14} />
                                        <span>{t.addExercise}</span>
                                    </button>
                                    {onOpenReorder && sessionExercises.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowSessionMenu(false);
                                                onOpenReorder();
                                            }}
                                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-surface-raised hover:text-white transition-colors"
                                        >
                                            <Icon name="ArrowUpDown" size={14} />
                                            <span>{t.reorderExercises}</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => openSubSheet('bodyweight', userBodyWeight ? String(toDisplay(userBodyWeight, unit)) : '')}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-surface-raised hover:text-white transition-colors"
                                    >
                                        <Icon name="Activity" size={14} className="text-zinc-400" />
                                        <span>{pickLang(lang, { es: 'Peso corporal', en: 'Bodyweight' })}</span>
                                    </button>
                                    <button
                                        type="button"
                                        data-testid="bad-session-btn"
                                        onClick={() => {
                                            setShowSessionMenu(false);
                                            setShowBadSessionSheet(true);
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/10 transition-colors"
                                    >
                                        <Icon name="AlertTriangle" size={14} />
                                        <span>{pickLang(lang, { es: 'Tuve una mala sesión', en: 'Had a bad workout' })}</span>
                                    </button>
                                    <div className="my-1 border-t border-border-subtle/50" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowSessionMenu(false);
                                            ctrl.setShowDiscardConfirm(true);
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <Icon name="Trash2" size={14} />
                                        <span>{t.discardSession || 'Descartar sesión'}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Row 2 */}
                <div className="flex items-center justify-between gap-2.5 px-4 pb-2.5 pt-0.5">
                    <div className="min-w-0 flex-1 text-[12px] font-medium text-zinc-400 truncate">
                        <span className="text-zinc-200 font-semibold">{dayName}</span>{mesoTitle ? <span className="text-zinc-400">{` · ${mesoTitle}`}</span> : null}
                    </div>
                    <div className="shrink-0 flex items-center">
                        <WorkoutTimer startTime={activeSession.startTime} />
                    </div>
                </div>

                {/* Thin Emerald Workout Progress Bar pinned at header bottom (RP 1:1) */}
                <div
                    data-testid="workout-progress-bar"
                    className="h-[3px] w-full bg-surface-raised overflow-hidden"
                    role="progressbar"
                    aria-valuenow={Math.round(workoutProgressPct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                >
                    <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, workoutProgressPct))}%` }}
                    />
                </div>
            </div>

            {/* Calendar / Weeks & Days Drawer */}
            {showCalendarDrawer && activeMeso && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowCalendarDrawer(false)}
                >
                    <div
                        className="w-full max-w-lg rounded-t-[20px] border-t border-border-subtle bg-surface-base p-4 pb-safe animate-in slide-in-from-bottom duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700" />
                        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                            <div>
                                <h3 className="text-base font-bold text-white">{activeMeso.name || 'Mesocycle'}</h3>
                                <p className="text-xs text-muted">
                                    {pickLang(lang, {
                                        es: `Semana ${activeSession.week} de ${totalWeeks}`,
                                        en: `Week ${activeSession.week} of ${totalWeeks}`,
                                    })}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCalendarDrawer(false)}
                                className="rounded-lg p-1.5 text-zinc-400 hover:text-white"
                                aria-label={t.cancel}
                            >
                                <Icon name="X" size={18} />
                            </button>
                        </div>
                        <div className="py-3">
                            <p className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                                {pickLang(lang, { es: 'Semanas', en: 'Weeks' })}
                            </p>
                            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((wNum) => (
                                    <div
                                        key={wNum}
                                        className={`flex h-8 min-w-[36px] px-2 items-center justify-center rounded-[6px] text-xs font-bold ${
                                            wNum === activeSession.week
                                                ? 'bg-primary-500 text-zinc-950 font-black'
                                                : 'bg-surface-raised text-zinc-400 border border-border-subtle'
                                        }`}
                                    >
                                        W{wNum}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {Array.isArray(activeMeso.plan) && (
                            <div className="py-2 space-y-1.5 max-h-56 overflow-y-auto">
                                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    {pickLang(lang, { es: 'Días del plan', en: 'Plan Days' })}
                                </p>
                                {activeMeso.plan.map((dayPlan: any, dIdx: number) => (
                                    <div
                                        key={dIdx}
                                        className={`flex items-center justify-between rounded-[6px] p-2 text-xs border ${
                                            dIdx === activeSession.dayIdx
                                                ? 'border-primary-500 bg-primary-500/10'
                                                : 'border-border-subtle bg-surface-raised/40'
                                        }`}
                                    >
                                        <span className="font-bold text-white">
                                            {pickLang(lang, { es: `Día ${dIdx + 1}`, en: `Day ${dIdx + 1}` })}
                                        </span>
                                        <span className="text-muted">
                                            {Array.isArray(dayPlan) ? `${dayPlan.length} ${pickLang(lang, { es: 'ejercicios', en: 'exercises' })}` : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mid-Meso Muscle Priorities Sheet (RP Video #7) */}
            {showPrioritiesSheet && activeMeso && (
                <Suspense fallback={null}>
                    <MusclePrioritiesSheet
                        open={showPrioritiesSheet}
                        onOpenChange={setShowPrioritiesSheet}
                        muscles={mesoMuscles}
                        initialPriorities={activeMeso.musclePriorities}
                        lang={lang}
                        onSave={(priorities: Partial<Record<MuscleGroup, MusclePriorityLevel>>) => {
                            setActiveMeso?.(prev => prev ? { ...prev, musclePriorities: priorities } : prev);
                        }}
                    />
                </Suspense>
            )}

            {/* RP Grouped Menu Sub-Sheets */}
            {activeSubSheet && (
                <Sheet
                    open={!!activeSubSheet}
                    onOpenChange={(o) => { if (!o) setActiveSubSheet(null); }}
                    title={
                        activeSubSheet === 'mesoNotes' ? pickLang(lang, { es: 'Notas del mesociclo', en: 'Mesocycle notes' })
                        : activeSubSheet === 'renameMeso' ? pickLang(lang, { es: 'Renombrar mesociclo', en: 'Rename mesocycle' })
                        : activeSubSheet === 'mesoSummary' ? pickLang(lang, { es: 'Resumen del mesociclo', en: 'Mesocycle summary' })
                        : activeSubSheet === 'workoutNote' ? pickLang(lang, { es: 'Nota del entrenamiento', en: 'Workout note' })
                        : activeSubSheet === 'relabelDay' ? pickLang(lang, { es: 'Renombrar día', en: 'Relabel workout' })
                        : activeSubSheet === 'bodyweight' ? pickLang(lang, { es: 'Registrar peso corporal', en: 'Log bodyweight' })
                        : pickLang(lang, { es: 'Finalizar mesociclo', en: 'End mesocycle' })
                    }
                    accent="primary"
                    footer={
                        activeSubSheet === 'mesoSummary' ? (
                            <Button fullWidth onClick={() => setActiveSubSheet(null)}>
                                {pickLang(lang, { es: 'Cerrar', en: 'Close' })}
                            </Button>
                        ) : activeSubSheet === 'endMesoConfirm' ? (
                            <div className="flex gap-3">
                                <Button variant="secondary" fullWidth onClick={() => setActiveSubSheet(null)}>{t.cancel}</Button>
                                <Button
                                    fullWidth
                                    onClick={() => {
                                        setActiveMeso?.(prev => prev ? { ...prev, completedAt: Date.now() } : null);
                                        setActiveSubSheet(null);
                                        setActiveMeso?.(null);
                                        onBack?.();
                                    }}
                                >
                                    {pickLang(lang, { es: 'Finalizar', en: 'End meso' })}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <Button variant="secondary" fullWidth onClick={() => setActiveSubSheet(null)}>{t.cancel}</Button>
                                <Button fullWidth onClick={handleSaveSubSheet}>{pickLang(lang, { es: 'Guardar', en: 'Save' })}</Button>
                            </div>
                        )
                    }
                >
                    <div className="p-4 space-y-3">
                        {(activeSubSheet === 'mesoNotes' || activeSubSheet === 'workoutNote') && (
                            <textarea
                                rows={4}
                                autoFocus
                                value={draftText}
                                onChange={(e) => setDraftText(e.target.value)}
                                placeholder={pickLang(lang, { es: 'Escribe tus notas aquí…', en: 'Write your notes here…' })}
                                className="w-full rounded-[8px] border border-border-subtle bg-surface-raised p-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-primary-500 resize-none"
                            />
                        )}
                        {(activeSubSheet === 'renameMeso' || activeSubSheet === 'relabelDay') && (
                            <input
                                type="text"
                                autoFocus
                                value={draftText}
                                onChange={(e) => setDraftText(e.target.value)}
                                className="w-full rounded-[8px] border border-border-subtle bg-surface-raised p-3 text-sm font-bold text-white outline-none focus:border-primary-500"
                            />
                        )}
                        {activeSubSheet === 'bodyweight' && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    autoFocus
                                    value={draftText}
                                    onChange={(e) => setDraftText(e.target.value)}
                                    placeholder="75"
                                    className="flex-1 rounded-[8px] border border-border-subtle bg-surface-raised p-3 text-base font-bold text-white outline-none focus:border-primary-500 tabular-nums"
                                />
                                <span className="text-sm font-bold uppercase text-zinc-400">{unitLbl}</span>
                            </div>
                        )}
                        {activeSubSheet === 'mesoSummary' && activeMeso && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-[8px] border border-border-subtle bg-surface-raised p-3">
                                    <div className="text-xs text-zinc-400">{pickLang(lang, { es: 'Semana actual', en: 'Current week' })}</div>
                                    <div className="text-lg font-black text-white mt-0.5 tabular-nums">{activeMeso.week} / {totalWeeks}</div>
                                </div>
                                <div className="rounded-[8px] border border-border-subtle bg-surface-raised p-3">
                                    <div className="text-xs text-zinc-400">{pickLang(lang, { es: 'Sesiones', en: 'Sessions' })}</div>
                                    <div className="text-lg font-black text-white mt-0.5 tabular-nums">{mesoSummaryStats.sessions}</div>
                                </div>
                                <div className="rounded-[8px] border border-border-subtle bg-surface-raised p-3 col-span-2">
                                    <div className="text-xs text-zinc-400">{pickLang(lang, { es: 'Series completadas en este ciclo', en: 'Completed sets in cycle' })}</div>
                                    <div className="text-lg font-black text-emerald-400 mt-0.5 tabular-nums">{mesoSummaryStats.totalSets}</div>
                                </div>
                                {mesoMuscles.length > 0 && (
                                    <div className="rounded-[8px] border border-border-subtle bg-surface-raised p-3 col-span-2 space-y-1.5">
                                        <div className="text-xs text-zinc-400">{pickLang(lang, { es: 'Prioridades actuales', en: 'Current priorities' })}</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {mesoMuscles.map(m => (
                                                <span key={m} className="rounded border border-border-subtle bg-surface-base px-2 py-0.5 text-[11px] font-bold text-zinc-200">
                                                    {resolveMuscleLabel(m, lang)}: {activeMeso.musclePriorities?.[m] || 'grow'}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeSubSheet === 'endMesoConfirm' && (
                            <p className="text-sm text-zinc-300 leading-relaxed">
                                {pickLang(lang, {
                                    es: 'Al finalizar este mesociclo pasarás a Mesociclos para planear el siguiente ciclo conservando todo tu historial.',
                                    en: 'Ending this mesocycle returns you to Mesocycles to plan your next block while keeping all logged history.',
                                })}
                            </p>
                        )}
                    </div>
                </Sheet>
            )}

            <div className="flex-1 overflow-hidden flex flex-col">
                <div
                    id="tut-exercise-list"
                    data-testid="workout-main"
                    className={`flex-1 overflow-y-auto scroll-container px-3 space-y-2.5 pt-3 ${restTimer?.active ? 'pb-36' : 'pb-10'}`}
                >
                    {activeMeso?.isDeload && (
                        <Suspense fallback={null}>
                            <DeloadRecoveryCard
                                stage={activeMeso.deloadStage || 'wired'}
                                lang={lang}
                                onSelectStage={(stage) =>
                                    setActiveMeso?.((prev) => (prev ? { ...prev, deloadStage: stage } : prev))
                                }
                                onOpenBadSession={() => setShowBadSessionSheet(true)}
                            />
                        </Suspense>
                    )}

                    {earlyDeloadStatus.status === 'early_deload_recommended' && !earlyDeloadDismissed && (
                        <div
                            data-testid="early-deload-banner"
                            className="rounded-[8px] border border-amber-500/40 bg-amber-500/12 p-3 flex flex-col gap-2"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                                    <Icon name="AlertTriangle" size={15} className="shrink-0" />
                                    <span>
                                        {pickLang(lang, {
                                            es: `${earlyDeloadStatus.consecutiveMisses} sesiones seguidas bajo objetivo · Recomendado Deload anticipado`,
                                            en: `${earlyDeloadStatus.consecutiveMisses} consecutive sessions below target · Early Deload recommended`,
                                        })}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEarlyDeloadDismissed(true)}
                                    className="text-zinc-400 hover:text-white"
                                    aria-label={t.cancel}
                                >
                                    <Icon name="X" size={14} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveMeso?.(prev => prev ? { ...prev, isDeload: true, deloadStage: 'wired' } : prev);
                                        setEarlyDeloadDismissed(true);
                                    }}
                                    className="rounded-[4px] bg-amber-500 px-3 py-1.5 text-xs font-bold text-zinc-950 hover:brightness-110"
                                >
                                    {pickLang(lang, { es: 'Activar Deload hoy', en: 'Start Early Deload' })}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowBadSessionSheet(true)}
                                    className="rounded-[4px] border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-500/15"
                                >
                                    {pickLang(lang, { es: 'Ver protocolo', en: 'Protocol' })}
                                </button>
                            </div>
                        </div>
                    )}

                    {showBadSessionSheet && (
                        <Suspense fallback={null}>
                            <BadSessionTriageSheet
                                open={showBadSessionSheet}
                                onOpenChange={setShowBadSessionSheet}
                                lang={lang}
                                onTriggerDeload={() =>
                                    setActiveMeso?.((prev) => (prev ? { ...prev, isDeload: true, deloadStage: 'wired' } : prev))
                                }
                            />
                        </Suspense>
                    )}

                    <Suspense fallback={null}>
                        <WorkoutSortableList itemIds={sortableItems} onReorder={handleReorder}>
                            {sessionExercises.map((ex, idx) => {
                                const supersetColorIndex = ex.supersetId ? supersetColorIndexes[ex.supersetId] : undefined;
                                const isLinkingTarget = !!linkingId && linkingId !== ex.instanceId;
                                const isFirstForMuscle = sessionExercises.findIndex((item) => item.muscle === ex.muscle) === idx;
                                const logsForMuscleCount = (logs || []).filter((l) => !l.skipped && l.mesoId === activeMeso?.id && (l.exercises || []).some((le) => le.muscle === ex.muscle)).length;
                                const sorenessDue = isFirstForMuscle && isRetrospectiveSorenessDue(
                                    ex.muscle,
                                    activeSession.week,
                                    logsForMuscleCount,
                                    activeSession.sorenessCheckins
                                );
                                const handleAnswerSoreness = (soreness: number, recovery: boolean) => {
                                    updateSession((prev) => {
                                        if (!prev) return prev;
                                        const nextCheckins = {
                                            ...(prev.sorenessCheckins || {}),
                                            [ex.muscle]: { soreness, recoveryMode: recovery, timestamp: Date.now() },
                                        };
                                        const nextExercises = recovery
                                            ? (prev.exercises || []).map((item: SessionExercise) =>
                                                  item.muscle === ex.muscle ? applyRecoverySessionToExercise(item, unit) : item
                                              )
                                            : prev.exercises;
                                        return {
                                            ...prev,
                                            sorenessCheckins: nextCheckins,
                                            recoveryMuscles: recovery
                                                ? Array.from(new Set([...(prev.recoveryMuscles || []), ex.muscle]))
                                                : prev.recoveryMuscles,
                                            exercises: nextExercises,
                                        };
                                    });
                                };

                                return (
                                    <SortableExerciseCard
                                        key={ex.instanceId}
                                        exercise={ex}
                                        isExpanded={ex.instanceId === activeExerciseId}
                                        onToggleExpand={handleToggleExpand}
                                        onSetUpdate={handleSetUpdate}
                                        onSetComplete={handleSetComplete}
                                        onSetTypeChange={handleSetTypeChange}
                                        onAddSet={handleAddSet}
                                        onDeleteSet={handleDeleteSet}
                                        onOpenDetail={setDetailExercise}
                                        onLink={setLinkingId}
                                        onReplace={setReplacingExId}
                                        onEditMuscle={setEditingMuscleId}
                                        onUpdateSession={updateSession}
                                        onOpenWarmup={setWarmupExId}
                                        openMenuId={openMenuId}
                                        setOpenMenuId={setOpenMenuId}
                                        linkingId={linkingId}
                                        t={t}
                                        lang={lang}
                                        supersetColorIndex={supersetColorIndex}
                                        isLinkingTarget={!!isLinkingTarget}
                                        config={config}
                                        stageConfig={stageConfig}
                                        dragEnabled={true}
                                        logs={logs}
                                        library={exercises}
                                        tutorialId={idx === 0 ? 'tut-set-type' : undefined}
                                        musclePriority={activeMeso?.musclePriorities?.[ex.muscle]}
                                        onMoveUp={idx > 0 ? () => handleSwapExerciseOrder?.(idx, -1) : undefined}
                                        onMoveDown={idx < sessionExercises.length - 1 ? () => handleSwapExerciseOrder?.(idx, 1) : undefined}
                                        onPinNoteToLibrary={handlePinNoteToLibrary}
                                        sorenessDue={sorenessDue}
                                        onAnswerSoreness={handleAnswerSoreness}
                                    />
                                );
                            })}
                        </WorkoutSortableList>
                    </Suspense>

                    <button
                        type="button"
                        onClick={() => setAddingExercise(true)}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[8px] border border-dashed border-border-strong bg-surface-raised/40 text-xs font-semibold text-muted hover:text-white hover:border-zinc-500 transition-colors active:scale-98"
                    >
                        <Icon name="Plus" size={15} />
                        {t.addExercise}
                    </button>

                    <div className="h-6" />
                </div>
            </div>
        </>
    );
};
