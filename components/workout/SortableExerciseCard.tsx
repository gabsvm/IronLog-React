
import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SessionExercise, WorkoutSet, CardioType, SetType } from '../../types';
import { Icon } from '../ui/Icon';
import { MuscleTag } from './MuscleTag';
import { SetRow } from './SetRow';
import { AVTRoundCard } from './AVTRoundCard';
import { EMOMTimer, TabataTimer } from './ProtocolTimers';
import { SkillProgressionBadge } from './SkillProgressionBadge';
import { getTranslated, roundWeight } from '../../utils';
import { useApp } from '../../context/AppContext';
import { useTimerContext } from '../../context/TimerContext';
import { triggerHaptic, playTimerFinishSound } from '../../utils/audio';

// ── Simple sparkline — pure SVG, no deps ──────────────────────────────────────
const SparkLine = React.memo(({ values }: { values: number[] }) => {
    if (values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const W = 56; const H = 18;
    const pts = values.map((v, i) => {
        const x = (i / (values.length - 1)) * W;
        const y = H - ((v - min) / range) * (H - 2) - 1;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const isUp = values[values.length - 1] >= values[0];
    const pct = (((values[values.length - 1] - values[0]) / values[0]) * 100);
    return (
        <div className="flex items-center gap-1.5">
            <svg width={W} height={H} className="overflow-visible shrink-0">
                <polyline points={pts} fill="none"
                    stroke={isUp ? '#22c55e' : '#ef4444'}
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className={`text-[9px] font-black tabular-nums ${isUp ? 'text-green-500' : 'text-red-400'}`}>
                {isUp ? '+' : ''}{pct.toFixed(1)}%
            </span>
        </div>
    );
});

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
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeEmomMinute, setActiveEmomMinute] = useState(0);
    const [showRestPreset, setShowRestPreset] = useState(false);
    const [restPresetInput, setRestPresetInput] = useState(String(ex.defaultRestSeconds || ''));
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
        setIsDeleting(false);
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
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === ex.instanceId ? null : ex.instanceId); setIsDeleting(false); }} 
                                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${openMenuId === ex.instanceId ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                            >
                                <Icon name="MoreVertical" size={20} />
                            </button>

                            {/* Dropdown Menu */}
                            {openMenuId === ex.instanceId && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-100 dark:border-white/5 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    {!isDeleting ? (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); if (onOpenDetail) onOpenDetail(ex); setOpenMenuId(null); }} className="w-full text-left px-4 py-3 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2">
                                                <Icon name="Info" size={16} /> {String(t.exDetail)}
                                            </button>
                                            <div className="h-px bg-zinc-100 dark:bg-white/5 my-1"></div>

                                            {isCardio && (
                                                <>
                                                    {['steady', 'hiit', 'tabata'].map(m => (
                                                        <button key={m} onClick={(e) => { e.stopPropagation(); handleCardioModeChange(m as CardioType); }} className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2 ${cardioMode === m ? 'text-blue-600' : 'text-zinc-600 dark:text-zinc-300'}`}>
                                                            {cardioMode === m && <Icon name="Check" size={14} />} {String(t.cardioModes?.[m])}
                                                        </button>
                                                    ))}
                                                    <div className="h-px bg-zinc-100 dark:bg-white/5 my-1"></div>
                                                </>
                                            )}

                                            {!isCardio && (
                                                <button onClick={(e) => { e.stopPropagation(); handleInjectWarmup(); }} className="w-full text-left px-4 py-3 text-sm font-bold text-orange-600 dark:text-orange-400 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2">
                                                    <Icon name="Zap" size={16} /> Add Warmup Sets
                                                </button>
                                            )}

                                            {!isCardio && !ex.isBodyweight && (
                                                <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newUnit = unit === 'kg' ? 'pl' : 'kg';
                                                    onUpdateSession((prev: any) => !prev ? null : {
                                                        ...prev,
                                                        exercises: prev.exercises.map((e: any) => e.instanceId === ex.instanceId ? { ...e, weightUnit: newUnit } : e)
                                                    });
                                                    setOpenMenuId(null);
                                                }} className="w-full text-left px-4 py-3 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2">
                                                    <Icon name="Settings" size={16} /> {String(t.units?.toggle)}
                                                </button>
                                            )}

                                            <div className="h-px bg-zinc-100 dark:bg-white/5 my-1"></div>
                                            <button onClick={(e) => { e.stopPropagation(); onReplace(ex.instanceId); }} className="w-full text-left px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2">
                                                <Icon name="RefreshCw" size={16} /> {String(t.replaceEx)}
                                            </button>
                                            {onSubBodyweight && (
                                                <button onClick={(e) => { e.stopPropagation(); onSubBodyweight(ex.instanceId, ex.muscle); setOpenMenuId(null); }} className="w-full text-left px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2">
                                                    <Icon name="Zap" size={16} /> {lang === 'es' ? 'Sub Bodyweight (Nilsson)' : 'Sub Bodyweight (Nilsson)'}
                                                </button>
                                            )}
                                            <button onClick={(e) => {
                                                e.stopPropagation();
                                                if (ex.supersetId) {
                                                    onUpdateSession((prev: any) => !prev ? null : {
                                                        ...prev,
                                                        exercises: (prev.exercises || []).map((e: any) => e.instanceId === ex.instanceId ? { ...e, supersetId: undefined } : e)
                                                    });
                                                } else {
                                                    onLink(ex.instanceId);
                                                }
                                                setOpenMenuId(null);
                                            }} className={`w-full text-left px-4 py-3 text-sm font-bold hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2 ${ssStyle ? 'text-red-500' : 'text-orange-600'}`}>
                                                <Icon name={ssStyle ? "Unlink" : "Link"} size={16} /> {ssStyle ? String(t.unlinkSuperset) : String(t.linkSuperset)}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); setRestPresetInput(String(ex.defaultRestSeconds || '')); setShowRestPreset(true); setOpenMenuId(null); }} className="w-full text-left px-4 py-3 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2">
                                                <Icon name="Clock" size={16} /> {lang === 'es' ? 'Rest Timer' : 'Rest Timer'}{ex.defaultRestSeconds ? ` · ${ex.defaultRestSeconds}s` : ''}
                                            </button>
                                            <div className="h-px bg-zinc-100 dark:bg-white/5 my-1"></div>
                                            <button onClick={(e) => { e.stopPropagation(); setIsDeleting(true); }} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
                                                <Icon name="Trash2" size={16} /> {String(t.removeEx)}
                                            </button>
                                        </>
                                    ) : (
                                        // Inline Delete Confirmation
                                        <div className="p-2 space-y-2 bg-red-50 dark:bg-red-900/10">
                                            <p className="text-xs text-red-600 text-center font-bold px-2">{String(t.confirmRemoveEx)}</p>
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); setIsDeleting(false); }} className="flex-1 py-2 text-xs font-bold bg-white dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300">
                                                    {String(t.cancel)}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); confirmDelete(); }} className="flex-1 py-2 text-xs font-bold bg-red-600 text-white rounded-lg">
                                                    {String(t.delete)}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Skill Progression Badge — for calisthenics skill families */}
                {ex.skillFamily && (
                    <SkillProgressionBadge exercise={ex} lang={lang} />
                )}

                {historicalBest && (
                    <div className="flex items-center gap-2 mb-1.5 px-1 mt-1">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <Icon name="Trophy" size={11} className="text-yellow-500 shrink-0" />
                            <p className="text-[10px] font-bold text-yellow-500/90 leading-snug truncate">
                                {lang === 'en' ? 'Best:' : 'Mejor:'}{' '}
                                {ex.isIsometric ? '⏱ ' : ''}
                                {historicalBest}
                            </p>
                        </div>
                        {oneRMHistory.length >= 3 && <SparkLine values={oneRMHistory} />}
                    </div>
                )}
                {overloadSuggest && !allDone && (
                    <div className="flex items-center gap-1.5 mb-1.5 px-1">
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                            <Icon name="TrendingUp" size={10} className="shrink-0" />
                            <span className="text-[9px] font-black uppercase tracking-wide">
                                {lang === 'es' ? `↑ +${overloadSuggest.kg}kg sugerido` : `↑ +${overloadSuggest.kg}kg suggested`}
                            </span>
                        </div>
                    </div>
                )}

                {lastNote && (
                    <div className="flex items-start gap-1.5 mb-1.5 px-1">
                        <Icon name="FileText" size={11} className="mt-0.5 text-zinc-600 shrink-0" />
                        <p className="text-[10px] text-zinc-600 italic leading-snug line-clamp-1">
                            {lastNote}
                        </p>
                    </div>
                )}

                {/* Per-exercise set progress bar */}
                {regularSets.length > 0 && (
                    <div className="flex items-center gap-2 px-1 -mb-0.5">
                        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-green-500' : 'bg-red-500/70'}`}
                                style={{ width: `${(completedCount / regularSets.length) * 100}%` }}
                            />
                        </div>
                        <span className={`text-[9px] font-black tabular-nums tracking-tight ${allDone ? 'text-green-500' : 'text-zinc-600'}`}>
                            {completedCount}/{regularSets.length}
                        </span>
                    </div>
                )}

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

                {isEMOM && (
                    <EMOMTimer
                        totalSets={regularSets.length}
                        lang={lang}
                        onMinuteChange={handleEmomMinuteChange}
                    />
                )}
                {isMyorep && (
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                        <Icon name="Repeat" size={12} className="text-purple-400" />
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Myo-rep</span>
                        <span className="text-[10px] text-purple-600 ml-0.5">{lang === 'es' ? '· Serie 1 = activación' : '· Set 1 = activation'}</span>
                        <span className="ml-auto text-[10px] text-purple-600 tabular-nums">{regularSets.length - 1} mini</span>
                    </div>
                )}
                {isCluster && (
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <Icon name="Grid3x3" size={12} className="text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Cluster</span>
                        <span className="ml-1 text-[10px] text-emerald-600">{lang === 'es' ? '· ~15s entre clusters' : '· ~15s intra-set rest'}</span>
                    </div>
                )}
                {isGiant && (
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                        <Icon name="Layers" size={12} className="text-orange-400" />
                        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Giant Set</span>
                        <span className="ml-1 text-[10px] text-orange-600">{lang === 'es' ? '· Reps altas al fallo' : '· High reps to failure'}</span>
                    </div>
                )}
                {hasTopBackoff && (
                    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-zinc-800/80 border border-zinc-700/50 rounded-xl">
                        <span className="text-[9px] font-black text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded">T</span>
                        <Icon name="ArrowRight" size={10} className="text-zinc-600" />
                        <span className="text-[9px] font-black text-blue-400 bg-blue-500/15 px-1.5 py-0.5 rounded">B</span>
                        <span className="text-[10px] font-bold text-zinc-500 ml-1">{lang === 'es' ? 'Top / Back-off' : 'Top / Back-off Protocol'}</span>
                    </div>
                )}
                {isTabata && (
                    <TabataTimer
                        totalRounds={regularSets.length}
                        lang={lang}
                    />
                )}
                {isHIIT && (
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <Icon name="Zap" size={12} className="text-amber-400" />
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">HIIT</span>
                        <span className="ml-1 text-[10px] text-amber-600">{lang === 'es' ? '· Intervalos alta intensidad' : '· High intensity intervals'}</span>
                        <span className="ml-auto text-[10px] text-amber-600 tabular-nums">{regularSets.length}</span>
                    </div>
                )}
            </div>

            {/* Sets Header */}
            <div className="grid grid-cols-12 gap-2 px-2 py-2 bg-zinc-50 dark:bg-black/20 border-b border-zinc-100 dark:border-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center items-center">
                <div className={`col-span-2 ${isEMOM ? 'text-cyan-500' : isMyorep ? 'text-purple-500' : isCluster ? 'text-emerald-500' : ''}`}>
                    {isEMOM ? 'Min' : isMyorep ? 'Set' : '#'}
                </div>
                {isCardio ? (
                    isInterval ? (
                        <>
                            <div className="col-span-4 pl-2 text-left text-green-600 dark:text-green-400">{String(t.cardioWork)}</div>
                            <div className="col-span-4 text-blue-500 dark:text-blue-400">{String(t.cardioRest)}</div>
                            <div className="col-span-2">{String(t.cardioRounds)}</div>
                        </>
                    ) : (
                        <>
                            <div className="col-span-4 text-center">{String(t.cardioTime)}</div>
                            <div className="col-span-4 text-center">{String(t.cardioDist)}</div>
                            <div className="col-span-2 text-center">{String(t.cardioSpeed)}</div>
                        </>
                    )
                ) : ex.isIsometric ? (
                    /* Isometric: HOLD TIME header */
                    <>
                        <div className="col-span-6 text-center text-violet-400">
                            {lang === 'es' ? '⏱ TIEMPO DE HOLD' : '⏱ HOLD TIME'}
                        </div>
                        <div className="col-span-2"></div>
                    </>
                ) : ex.isBodyweight ? (
                    /* Bodyweight: reps first, optional +kg */
                    <>
                        <div className="col-span-6 text-center">{String(t.reps)}</div>
                        <div className="col-span-2 text-center text-violet-400/60">+KG</div>
                    </>
                ) : (
                    /* Standard weighted */
                    <>
                        <div className="col-span-4 text-center">
                            {`${String(t.weight)} (${unitLabel})`}
                        </div>
                        <div className="col-span-4 text-center">{String(t.reps)}</div>
                        {config.showRIR && <div className="col-span-2 text-center">{String(t.rir)}</div>}
                        {!config.showRIR && <div className="col-span-2"></div>}
                    </>
                )}
                <div className="col-span-2"></div>
            </div>

            {/* Sets List */}
            <div className={`divide-y divide-zinc-100 dark:divide-white/5 ${viewMode === 'focus' ? 'overflow-y-auto flex-1' : ''}`}>
                {regularSets.map((set, idx) => (
                    <SetRow
                        key={set.id}
                        set={set}
                        exInstanceId={ex.instanceId}
                        unit={unit}
                        unitLabel={unitLabel}
                        plateWeight={ex.plateWeight}
                        showRIR={config.showRIR || isCardio}
                        stageRIR={stageConfig?.rir !== null ? String(stageConfig?.rir) : "-"}
                        onUpdate={onSetUpdate}
                        onToggleComplete={onSetComplete}
                        onChangeType={(exId, setId, type) => onSetTypeChange(exId, setId, type)}
                        lang={lang}
                        isCardio={isCardio}
                        cardioMode={cardioMode}
                        isBodyweight={ex.isBodyweight}
                        isIsometric={ex.isIsometric}
                        isometricTargetSecs={ex.isIsometric ? (ex as any).isometricTargetSecs : undefined}
                        setIndex={idx}
                        badgeLabel={setBadgeLabels[idx]}
                        tutorialId={idx === 0 ? tutorialId : undefined}
                        disableTypeChange={isSpecialProtocol}
                        isActiveProtocolSet={isEMOM && activeEmomMinute === idx + 1}
                        isNextSet={nextSetIdx === idx}
                    />
                ))}

                {isAVTExercise && avtRounds.map((round, idx) => (
                    <AVTRoundCard
                        key={round.roundId}
                        roundId={round.roundId}
                        hops={round.hops}
                        roundNumber={idx + 1}
                        exInstanceId={ex.instanceId}
                        unit={unitLabel}
                        onUpdate={onSetUpdate}
                        onToggleComplete={onSetComplete}
                        onMarkLastHop={onMarkLastHop}
                        onAddHop={onAddHopToRound}
                    />
                ))}
            </div>

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

            {/* Rest Timer Preset Modal */}
            {showRestPreset && (
                <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-6" onClick={() => setShowRestPreset(false)}>
                    <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-xs space-y-4 border border-zinc-800" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-white">{lang === 'es' ? 'Descanso (segundos)' : 'Rest Time (seconds)'}</h3>
                            <button onClick={() => setShowRestPreset(false)} className="text-zinc-500 hover:text-white">
                                <Icon name="X" size={18} />
                            </button>
                        </div>
                        <input
                            type="number" inputMode="numeric" autoFocus
                            className="w-full bg-zinc-800 rounded-xl p-3 text-center font-bold text-xl text-white outline-none focus:ring-2 focus:ring-white/20"
                            value={restPresetInput}
                            onChange={e => setRestPresetInput(e.target.value)}
                            placeholder="120"
                        />
                        <div className="flex gap-2">
                            {[60, 90, 120, 180].map(s => (
                                <button key={s} onClick={() => setRestPresetInput(String(s))}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${restPresetInput === String(s) ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                                    {s}s
                                </button>
                            ))}
                        </div>
                        <button
                            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
                            onClick={() => {
                                const secs = parseInt(restPresetInput);
                                onUpdateSession((prev: any) => !prev ? null : {
                                    ...prev,
                                    exercises: prev.exercises.map((e: any) =>
                                        e.instanceId === ex.instanceId
                                            ? { ...e, defaultRestSeconds: isNaN(secs) || secs <= 0 ? undefined : secs }
                                            : e
                                    )
                                });
                                setShowRestPreset(false);
                                triggerHaptic('medium');
                            }}
                        >
                            {lang === 'es' ? 'Guardar' : 'Save'}
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
});
