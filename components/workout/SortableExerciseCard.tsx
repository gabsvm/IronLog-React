
import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SessionExercise, WorkoutSet, CardioType, SetType } from '../../types';
import { Icon } from '../ui/Icon';
import { MuscleTag } from './MuscleTag';
import { SkillProgressionBadge } from './SkillProgressionBadge';
import { ExerciseCardStats } from './ExerciseCardStats';
import { ExerciseProtocolBanners } from './ExerciseProtocolBanners';
import { ExerciseCardMenu } from './ExerciseCardMenu';
import { ExerciseCardSets } from './ExerciseCardSets';
import { RestPresetSheet } from './RestPresetSheet';
import { getTranslated, roundWeight } from '../../utils';
import { useApp } from '../../context/AppContext';
import { useTimerContext } from '../../context/TimerContext';
import { triggerHaptic, playTimerFinishSound } from '../../utils/audio';

interface SortableExerciseCardProps {
    exercise: SessionExercise;
    onSetUpdate: (exId: number, setId: number, field: string, value: any) => void;
    onSetComplete: (exId: number, setId: number) => void;
    onSetTypeChange: (exId: number, setId: number, type: SetType) => void;
    onAddSet: (id: number) => void;
    onDeleteSet: (exId: number, setId: number) => void;
    onOpenDetail?: (ex: SessionExercise) => void;

    // Handlers for menu actions
    onLink: (id: number | null) => void;
    onReplace: (id: number | null) => void;
    onSubBodyweight?: (id: number, muscle: import('../../types').MuscleGroup) => void;
    onEditMuscle: (id: number | null) => void;
    onConfigPlate: (id: number | null) => void;
    onUpdateSession: (cb: any) => void;
    onOpenWarmup?: (id: number) => void; // New prop to trigger modal
    onMarkLastHop: (exId: number, setId: number) => void;
    onAddHopToRound: (exId: number, roundId: number) => void;
    onAddAVTRound: (exId: number) => void;

    // UI State passed down
    openMenuId: number | null;
    setOpenMenuId: (id: number | null) => void;
    linkingId: number | null;

    t: any;
    lang: 'en' | 'es';
    supersetStyle: any;
    isLinkingTarget: boolean;
    config: any;
    stageConfig: any;
    viewMode?: 'list' | 'focus';

    // Tutorial Hook
    tutorialId?: string; // "tut-set-type" from parent if first card
}

export const SortableExerciseCard = React.memo(({
    exercise: ex,
    onSetUpdate,
    onSetComplete,
    onSetTypeChange,
    onAddSet,
    onDeleteSet,
    onOpenDetail,
    onLink,
    onReplace,
    onSubBodyweight,
    onEditMuscle,
    onConfigPlate,
    onUpdateSession,
    onOpenWarmup,
    onMarkLastHop,
    onAddHopToRound,
    onAddAVTRound,
    openMenuId,
    setOpenMenuId,
    linkingId,
    t,
    lang,
    supersetStyle,
    isLinkingTarget,
    config,
    stageConfig,
    viewMode = 'list',
    tutorialId
}: SortableExerciseCardProps) => {
    const { restTimer } = useTimerContext();
    const { logs } = useApp();
    const [activeEmomMinute, setActiveEmomMinute] = useState(0);
    const [showRestPreset, setShowRestPreset] = useState(false);
    const [exDoneFlash, setExDoneFlash] = useState(false);
    const handleEmomMinuteChange = useCallback((m: number) => setActiveEmomMinute(m), []);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: ex.instanceId });

    const style = viewMode === 'list' ? {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0.8 : 1,
        position: 'relative' as const,
    } : { position: 'relative' as const };

    const sets = ex.sets || [];
    const ssStyle = supersetStyle;
    const unit = ex.weightUnit || 'kg';
    const unitLabel = unit === 'pl' ? 'PL' : 'KG';

    const isCardio = ex.muscle === 'CARDIO';
    const cardioMode: CardioType = ex.cardioType || ex.defaultCardioType || 'steady';
    const isInterval = cardioMode === 'hiit' || cardioMode === 'tabata';

    // 1. Get Last Note
    const lastNote = useMemo(() => {
        if (!logs) return null;
        for (let i = 0; i < logs.length; i++) {
            const log = logs[i];
            if (log.skipped) continue;
            const found = log.exercises?.find(e => e.id === ex.id);
            if (found && found.note) return String(found.note);
        }
        return null;
    }, [logs, ex.id]);

    // 2. Calculate Historical Best PR — context-aware
    const historicalBest = useMemo(() => {
        if (!logs || isCardio || !ex.id) return null;

        // ISOMETRIC: best hold time in seconds
        if (ex.isIsometric) {
            let bestSec = 0;
            logs.forEach(l => {
                if (l.skipped) return;
                const pastEx = l.exercises?.find(e => e.id === ex.id);
                if (!pastEx) return;
                (pastEx.sets || []).forEach(s => {
                    if (s.completed && s.duration) {
                        const sec = Number(s.duration);
                        if (sec > bestSec) bestSec = sec;
                    }
                });
            });
            if (bestSec === 0) return null;
            const m = Math.floor(bestSec / 60);
            const s = bestSec % 60;
            return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${bestSec}s`;
        }

        // BODYWEIGHT (non-isometric): best max reps in one set
        if (ex.isBodyweight) {
            let bestReps = 0;
            let bestWeight = 0;
            logs.forEach(l => {
                if (l.skipped) return;
                const pastEx = l.exercises?.find(e => e.id === ex.id);
                if (!pastEx) return;
                (pastEx.sets || []).forEach(s => {
                    if (s.completed && s.reps) {
                        const r = Number(s.reps);
                        const w = Number(s.weight) || 0;
                        if (r > bestReps || (r === bestReps && w > bestWeight)) {
                            bestReps = r;
                            bestWeight = w;
                        }
                    }
                });
            });
            if (bestReps === 0) return null;
            return bestWeight > 0 ? `${bestReps} reps (+${bestWeight}kg)` : `${bestReps} reps`;
        }

        // WEIGHTED GYM: estimated 1RM
        let best1RM = 0;
        let bestStr = '';
        logs.forEach(l => {
            if (l.skipped) return;
            const pastEx = l.exercises?.find(e => e.id === ex.id);
            if (!pastEx) return;
            (pastEx.sets || []).forEach(s => {
                if (s.completed && s.weight && s.reps) {
                    const e1rm = Number(s.weight) * (1 + Number(s.reps) / 30);
                    if (e1rm > best1RM) {
                        best1RM = e1rm;
                        bestStr = `${s.weight}${unitLabel.toLowerCase()} × ${s.reps} (1RM: ${Math.round(e1rm)})`;
                    }
                }
            });
        });
        return best1RM > 0 ? bestStr : null;
    }, [logs, ex.id, isCardio, ex.isIsometric, ex.isBodyweight, unitLabel]);

    // Agrupar sets AVT por roundId
    const avtRounds = useMemo(() => {
        const hopSets = ex.sets.filter(s => s.type === 'avt_hop' && s.avtRoundId);
        const groups: Record<number, WorkoutSet[]> = {};
        hopSets.forEach(s => {
            const rid = s.avtRoundId!;
            if (!groups[rid]) groups[rid] = [];
            groups[rid].push(s);
        });
        return Object.entries(groups).map(([id, hops]) => ({ roundId: Number(id), hops }));
    }, [ex.sets]);

    const isAVTExercise = avtRounds.length > 0;
    // Memoized so the auto-scroll useEffect only fires on actual completion changes,
    // not on every render that produces a new array reference.
    const regularSets = useMemo(() => ex.sets.filter(s => s.type !== 'avt_hop'), [ex.sets]);
    const completedCount = regularSets.filter(s => s.completed).length;
    const allDone = regularSets.length > 0 && completedCount === regularSets.length;

    // ── Progressive overload auto-suggest ────────────────────────────
    // Show "+2.5 kg suggested" when last session had all working sets completed at/above target reps
    const overloadSuggest = useMemo(() => {
        if (!logs || isCardio || ex.isBodyweight || ex.isIsometric || !ex.id) return null;
        for (let i = logs.length - 1; i >= 0; i--) {
            const l = logs[i];
            if (l.skipped) continue;
            const pastEx = l.exercises?.find(e => e.id === ex.id);
            if (!pastEx) continue;
            const working = (pastEx.sets || []).filter((s: any) => s.type !== 'warmup' && s.type !== 'avt_hop');
            if (working.length === 0) return null;
            const allCompleted = working.every((s: any) => s.completed);
            if (!allCompleted) return null;
            const avgWeight = working.reduce((sum: number, s: any) => sum + Number(s.weight || 0), 0) / working.length;
            if (avgWeight <= 0) return null;
            const target = ex.targetReps ? parseInt(String(ex.targetReps)) : null;
            if (!target) return { kg: 2.5 };
            const allHitTarget = working.every((s: any) => Number(s.reps) >= target);
            return allHitTarget ? { kg: 2.5 } : null;
        }
        return null;
    }, [logs, ex.id, ex.targetReps, isCardio, ex.isBodyweight, ex.isIsometric]);

    // ── 1RM sparkline history (last 8 sessions) ──────────────────────
    const oneRMHistory = useMemo(() => {
        if (!logs || isCardio || ex.isBodyweight || ex.isIsometric || !ex.id) return [];
        const points: number[] = [];
        for (let i = logs.length - 1; i >= 0 && points.length < 8; i--) {
            const l = logs[i];
            if (l.skipped) continue;
            const pastEx = l.exercises?.find(e => e.id === ex.id);
            if (!pastEx) continue;
            let best = 0;
            (pastEx.sets || []).forEach(s => {
                if (s.completed && s.weight && s.reps) {
                    const e1rm = Number(s.weight) * (1 + Number(s.reps) / 30);
                    if (e1rm > best) best = e1rm;
                }
            });
            if (best > 0) points.unshift(best);
        }
        return points;
    }, [logs, ex.id, isCardio, ex.isBodyweight, ex.isIsometric]);

    // ── Auto-scroll to next uncompleted set ─────────────────────────
    const prevCompletedRef = useRef(completedCount);
    const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (completedCount > prevCompletedRef.current) {
            // Exercise complete celebration
            if (completedCount === regularSets.length && regularSets.length > 0) {
                setExDoneFlash(true);
                triggerHaptic('success');
                playTimerFinishSound();
                if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
                flashTimerRef.current = setTimeout(() => setExDoneFlash(false), 1200);
            }
            // Scroll next set into view
            const nextSet = regularSets.find(s => !s.completed);
            if (nextSet) {
                setTimeout(() => {
                    document.getElementById(`set-row-${nextSet.id}`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 180);
            }
        }
        prevCompletedRef.current = completedCount;
        return () => { if (flashTimerRef.current) clearTimeout(flashTimerRef.current); };
    }, [completedCount, regularSets]);

    // ── Protocol detections ──────────────────────────────────────────
    const isProtocol = !isCardio && !ex.isIsometric;
    const isEMOM      = isProtocol && regularSets.length > 0 && regularSets.every(s => s.type === 'emom');
    const isMyorep    = isProtocol && regularSets.length > 0 && regularSets.every(s => s.type === 'myorep' || s.type === 'myorep_match');
    const isCluster   = isProtocol && regularSets.length > 0 && regularSets.every(s => s.type === 'cluster');
    const isGiant     = isProtocol && regularSets.length > 0 && regularSets.every(s => s.type === 'giant');
    const hasTopBackoff = isProtocol && regularSets.some(s => s.type === 'top') && regularSets.some(s => s.type === 'backoff');
    const isTabata    = isCardio && cardioMode === 'tabata';
    const isHIIT      = isCardio && cardioMode === 'hiit';
    const isSpecialProtocol = isEMOM || isMyorep || isCluster || isGiant;
    // Highlight the next uncompleted set; disabled for protocols that drive their own progression
    const nextSetIdx = (!isSpecialProtocol && !isTabata && !isHIIT) ? regularSets.findIndex(s => !s.completed) : -1;

    // ── Badge labels per set ─────────────────────────────────────────
    const setBadgeLabels = useMemo((): (string | undefined)[] => {
        if (isEMOM)   return regularSets.map((_, i) => String(i + 1));
        if (isMyorep) return regularSets.map((_, i) => i === 0 ? 'ACT' : `M${i}`);
        if (hasTopBackoff) {
            let bCount = 0;
            return regularSets.map(s => s.type === 'backoff' ? `B${++bCount}` : undefined);
        }
        return regularSets.map(() => undefined);
    }, [isEMOM, isMyorep, hasTopBackoff, regularSets]);

    const handleInjectWarmup = () => {
        const firstRegularSet = sets.find(s => s.type === 'regular');
        const targetWeight = Number(firstRegularSet?.weight) || Number(firstRegularSet?.hintWeight) || 0;

        if (targetWeight === 0) return;

        const newSets: WorkoutSet[] = [
            { pct: 0.5, reps: 12 },
            { pct: 0.75, reps: 5 },
            { pct: 0.9, reps: 1 }
        ].map((step, i) => ({
            id: Date.now() + i,
            type: 'warmup',
            weight: roundWeight(targetWeight * step.pct),
            reps: step.reps,
            rpe: '',
            completed: false
        }));

        onUpdateSession((prev: any) => !prev ? null : {
            ...prev,
            exercises: prev.exercises.map((e: any) =>
                e.instanceId === ex.instanceId
                    ? { ...e, sets: [...newSets, ...e.sets] }
                    : e
            )
        });
        setOpenMenuId(null);
    };

    const handleCardioModeChange = (mode: CardioType) => {
        onUpdateSession((prev: any) => !prev ? null : {
            ...prev,
            exercises: prev.exercises.map((e: any) =>
                e.instanceId === ex.instanceId
                    ? { ...e, cardioType: mode }
                    : e
            )
        });
        setOpenMenuId(null);
    };

    const handleNoteUpdate = (val: string) => {
        onUpdateSession((prev: any) => !prev ? null : {
            ...prev,
            exercises: prev.exercises.map((e: any) => e.instanceId === ex.instanceId ? { ...e, note: val } : e)
        });
    };

    const confirmDelete = () => {
        onUpdateSession((prev: any) => prev ? { ...prev, exercises: prev.exercises.filter((e: any) => e.instanceId !== ex.instanceId) } : null);
        setOpenMenuId(null);
    };

    const handleToggleUnit = () => {
        const newUnit = unit === 'kg' ? 'pl' : 'kg';
        onUpdateSession((prev: any) => !prev ? null : {
            ...prev,
            exercises: prev.exercises.map((e: any) => e.instanceId === ex.instanceId ? { ...e, weightUnit: newUnit } : e)
        });
    };

    const handleToggleSuperset = () => {
        if (ex.supersetId) {
            onUpdateSession((prev: any) => !prev ? null : {
                ...prev,
                exercises: (prev.exercises || []).map((e: any) => e.instanceId === ex.instanceId ? { ...e, supersetId: undefined } : e)
            });
        } else {
            onLink(ex.instanceId);
        }
        setOpenMenuId(null);
    };

    const handleSaveRestPreset = (secs: number | undefined) => {
        onUpdateSession((prev: any) => !prev ? null : {
            ...prev,
            exercises: prev.exercises.map((e: any) =>
                e.instanceId === ex.instanceId ? { ...e, defaultRestSeconds: secs } : e
            )
        });
    };

    return (
        <motion.div
            layout={isDragging ? false : 'position'}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            ref={viewMode === 'list' ? setNodeRef : null}
            style={style}
            onClick={() => {
                if (isLinkingTarget) {
                    const ssid = `ss_${Date.now()}`;
                    onUpdateSession((prev: any) => !prev ? null : {
                        ...prev,
                        exercises: prev.exercises.map((e: any) => (e.instanceId === linkingId || e.instanceId === ex.instanceId) ? { ...e, supersetId: ssid } : e)
                    });
                    onLink(null);
                }
            }}
            className={`
                flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-white/5 overflow-hidden transition-all
                ${ssStyle ? `border-l-4 ${ssStyle.border}` : ''}
                ${isLinkingTarget ? 'ring-2 ring-orange-500 cursor-pointer opacity-80 hover:opacity-100' : ''}
                ${linkingId === ex.instanceId ? 'ring-2 ring-orange-500' : ''}
                ${isDragging ? 'shadow-2xl ring-2 ring-red-500/20 scale-[1.02]' : ''}
                ${viewMode === 'focus' ? 'h-full flex-1' : ''} 
            `}
        >
            {/* Header */}
            <div className="p-3 md:p-4 flex flex-col gap-2 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            {/* Drag Handle */}
                            {viewMode === 'list' && (
                                <div
                                    className="touch-none cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-200 p-2 -ml-2 mr-1"
                                    {...attributes}
                                    {...listeners}
                                >
                                    <Icon name="GripVertical" size={20} />
                                </div>
                            )}

                            {ssStyle && <span className={`${ssStyle.badge} text-[9px] font-bold px-1.5 py-0.5 rounded`}>SS</span>}
                            <MuscleTag label={String(ex.slotLabel || ex.muscle || 'CHEST')} />

                            {isCardio ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                                    {String(t.cardioModes?.[cardioMode] || cardioMode)}
                                </span>
                            ) : (
                                ex.targetReps && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                        {String(ex.targetReps)} Reps
                                    </span>
                                )
                            )}

                            {ex.isBodyweight && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                                    BW
                                </span>
                            )}

                            {!isCardio && unit === 'pl' && !ex.isBodyweight && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onConfigPlate(ex.instanceId); }}
                                    className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded hover:bg-blue-200"
                                >
                                    {ex.plateWeight ? `1 PL = ${ex.plateWeight}kg` : String(t.units?.setPlateWeight)}
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <h3
                                onClick={(e) => { e.stopPropagation(); if (onOpenDetail) onOpenDetail(ex); }}
                                className="text-xl font-black text-white leading-tight tracking-tight pl-1 cursor-pointer hover:text-red-400 transition-colors"
                            >
                                {String(getTranslated(ex.name, lang))}
                            </h3>
                            <button
                                onClick={(e) => { e.stopPropagation(); if (onOpenDetail) onOpenDetail(ex); }}
                                className="text-zinc-600 hover:text-red-400 transition-colors shrink-0"
                            >
                                <Icon name="Info" size={15} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* Integrated Rest Timer Badge */}
                        {restTimer.active && restTimer.timeLeft > 0 && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-900/50 text-violet-300 border border-violet-500/40 rounded-lg animate-pulse shadow-lg shadow-violet-900/30 backdrop-blur-sm mr-1">
                                <Icon name="Clock" size={12} strokeWidth={3} />
                                <span className="text-[10px] font-black font-mono tracking-tight">
                                    {Math.floor(restTimer.timeLeft / 60)}:{(restTimer.timeLeft % 60).toString().padStart(2, '0')}
                                </span>
                            </div>
                        )}

                        {/* Warmup: only for weighted exercises (not bodyweight, not isometric, not cardio) */}
                        {!isCardio && !ex.isBodyweight && !ex.isIsometric && (
                            <button
                                id={tutorialId ? "tut-warmup-btn" : undefined}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onOpenWarmup) onOpenWarmup(ex.instanceId);
                                    else handleInjectWarmup();
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/10 text-orange-500 hover:scale-110 transition-transform"
                                title="Warmup Calculator"
                            >
                                <Icon name="Zap" size={16} />
                            </button>
                        )}

                        <div className="relative">
                            <button
                                aria-label={lang === 'es' ? 'Más opciones' : 'More options'}
                                aria-haspopup="menu"
                                aria-expanded={openMenuId === ex.instanceId}
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === ex.instanceId ? null : ex.instanceId); }}
                                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-fast ease-natural ${openMenuId === ex.instanceId ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                            >
                                <Icon name="MoreVertical" size={20} />
                            </button>

                            <ExerciseCardMenu
                                ex={ex}
                                isOpen={openMenuId === ex.instanceId}
                                onClose={() => setOpenMenuId(null)}
                                isCardio={isCardio}
                                cardioMode={cardioMode}
                                unit={unit}
                                hasSuperset={!!ssStyle}
                                onOpenDetail={onOpenDetail}
                                onCardioModeChange={handleCardioModeChange}
                                onInjectWarmup={handleInjectWarmup}
                                onToggleUnit={handleToggleUnit}
                                onReplace={onReplace}
                                onSubBodyweight={onSubBodyweight}
                                onToggleSuperset={handleToggleSuperset}
                                onOpenRestPreset={() => setShowRestPreset(true)}
                                onRequestDelete={confirmDelete}
                                t={t}
                                lang={lang}
                                supersetStyle={ssStyle}
                            />
                        </div>
                    </div>
                </div>

                {/* Skill Progression Badge — for calisthenics skill families */}
                {ex.skillFamily && (
                    <SkillProgressionBadge exercise={ex} lang={lang} />
                )}

                <ExerciseCardStats
                    lang={lang}
                    isIsometric={ex.isIsometric}
                    historicalBest={historicalBest}
                    oneRMHistory={oneRMHistory}
                    overloadSuggest={overloadSuggest}
                    allDone={allDone}
                    lastNote={lastNote}
                    completedCount={completedCount}
                    totalSets={regularSets.length}
                />

                <div className="relative flex items-center">
                    <Icon name="Pencil" size={11} className="absolute left-2 text-zinc-700 pointer-events-none" />
                    <input
                        type="text"
                        placeholder={String(t.addNote)}
                        value={ex.note || ''}
                        onChange={(e) => handleNoteUpdate(e.target.value)}
                        className="w-full bg-zinc-800/60 text-xs text-zinc-400 placeholder-zinc-700 outline-none rounded-lg py-1.5 pl-6 pr-2 focus:bg-zinc-800 focus:text-white focus:placeholder-zinc-600 transition-colors"
                    />
                </div>

                <ExerciseProtocolBanners
                    lang={lang}
                    totalSets={regularSets.length}
                    isEMOM={isEMOM}
                    isMyorep={isMyorep}
                    isCluster={isCluster}
                    isGiant={isGiant}
                    hasTopBackoff={hasTopBackoff}
                    isTabata={isTabata}
                    isHIIT={isHIIT}
                    onEmomMinuteChange={handleEmomMinuteChange}
                />
            </div>

            <ExerciseCardSets
                ex={ex}
                regularSets={regularSets}
                avtRounds={avtRounds}
                isAVTExercise={isAVTExercise}
                isCardio={isCardio}
                isInterval={isInterval}
                cardioMode={cardioMode}
                unit={unit}
                unitLabel={unitLabel}
                isEMOM={isEMOM}
                isMyorep={isMyorep}
                isCluster={isCluster}
                isSpecialProtocol={isSpecialProtocol}
                activeEmomMinute={activeEmomMinute}
                nextSetIdx={nextSetIdx}
                setBadgeLabels={setBadgeLabels}
                onSetUpdate={onSetUpdate}
                onSetComplete={onSetComplete}
                onSetTypeChange={onSetTypeChange}
                onMarkLastHop={onMarkLastHop}
                onAddHopToRound={onAddHopToRound}
                config={config}
                stageConfig={stageConfig}
                t={t}
                lang={lang}
                viewMode={viewMode}
                tutorialId={tutorialId}
            />

            {/* Exercise-complete flash overlay */}
            {exDoneFlash && (
                <div className="absolute inset-0 z-10 pointer-events-none rounded-2xl ring-2 ring-green-500/60 bg-green-500/5 flex items-center justify-center animate-in fade-in duration-150">
                    <div className="bg-green-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-green-500/30 animate-bounce">
                        <Icon name="CheckCircle" size={14} className="inline mr-1" />
                        {lang === 'es' ? '¡Listo!' : 'Done!'}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="bg-black/20 border-t border-white/5 grid grid-cols-2 divide-x divide-white/10 shrink-0">
                <button
                    onClick={() => sets.length > 0 && onDeleteSet(ex.instanceId, sets[sets.length - 1].id)}
                    disabled={sets.length <= 1}
                    className="w-full py-3.5 flex items-center justify-center gap-2 text-xs font-bold text-zinc-500 hover:text-red-400 disabled:opacity-25 transition-colors active:scale-95"
                >
                    <Icon name="Minus" size={13} /> {String(t.removeSetBtn)}
                </button>
                <button
                    onClick={() => isAVTExercise ? onAddAVTRound(ex.instanceId) : onAddSet(ex.instanceId)}
                    className="w-full py-3.5 flex items-center justify-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors active:scale-95"
                >
                    <Icon name="Plus" size={13} /> {isAVTExercise ? t.addRound : t.addSetBtn}
                </button>
            </div>

            <RestPresetSheet
                open={showRestPreset}
                onOpenChange={setShowRestPreset}
                initialSeconds={ex.defaultRestSeconds || 0}
                onSave={handleSaveRestPreset}
                lang={lang}
            />
        </motion.div>
    );
});
