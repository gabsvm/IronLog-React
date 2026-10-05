// U5: SortableExerciseCard state and handlers, moved verbatim from components/workout/SortableExerciseCardImpl.tsx.
import { useMemo, useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SessionExercise, WorkoutSet, CardioType, SetType } from '../../../types';
import { parseTargetReps, roundWeight } from '../../../utils';
import { formatWeight, resolveWeightUnit, toDisplay, unitLabel as unitLabelFor } from '../../../utils/units';
import { formatProgressionReason, recommendProgression } from '../../../utils/recommendationEngine';
import { triggerHaptic, playTimerFinishSound } from '../../../utils/audio';
import { TRANSLATIONS } from '../../../constants';

export interface SortableExerciseCardProps {
    exercise: SessionExercise;
    onSetUpdate: (exId: number, setId: number, field: string, value: any) => void;
    onSetComplete: (exId: number, setId: number) => void;
    onSetTypeChange: (exId: number, setId: number, type: SetType) => void;
    onAddSet: (id: number) => void;
    onDeleteSet: (exId: number, setId: number) => void;
    onOpenDetail?: (ex: SessionExercise) => void;
    onLink: (id: number | null) => void;
    onReplace: (id: number | null) => void;
    onEditMuscle: (id: number | null) => void;
    onUpdateSession: (cb: any) => void;
    onOpenWarmup?: (id: number) => void;
    openMenuId: number | null;
    setOpenMenuId: (id: number | null) => void;
    linkingId: number | null;
    t: any;
    lang: 'en' | 'es';
    supersetColorIndex?: number;
    isLinkingTarget: boolean;
    config: any;
    stageConfig: any;
    dragEnabled?: boolean;
    logs: import('../../../types').Log[];
    /** Full exercise library for merged-history resolution (optional; wrapper use only). */
    library?: import('../../../types').ExerciseDef[];
    tutorialId?: string;
    isExpanded?: boolean;
    onToggleExpand?: (id: number) => void;
}

export const useSortableExerciseCardState = ({
    exercise: ex,
    onSetUpdate,
    onSetComplete,
    onSetTypeChange,
    onAddSet,
    onDeleteSet,
    onOpenDetail,
    onLink,
    onReplace,
    onEditMuscle,
    onUpdateSession,
    onOpenWarmup,
    openMenuId,
    setOpenMenuId,
    linkingId,
    t,
    lang,
    supersetColorIndex,
    isLinkingTarget,
    config,
    stageConfig,
    dragEnabled = true,
    logs,
    tutorialId,
    isExpanded = true,
    onToggleExpand,
}: SortableExerciseCardProps) => {
    const [exDoneFlash, setExDoneFlash] = useState(false);
    const [activeEmomMinute, setActiveEmomMinute] = useState(0);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: ex.instanceId, disabled: !dragEnabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0.8 : 1,
        willChange: isDragging ? 'transform' as const : undefined,
        position: 'relative' as const,
        contentVisibility: 'auto' as const,
        containIntrinsicSize: '500px',
        contain: 'layout paint style' as const,
    };

    const sets = ex.sets || [];
    const c = TRANSLATIONS[lang].exerciseCard;
    const ssStyle = typeof supersetColorIndex === 'number'
        ? [
            { border: 'border-l-orange-500', badge: 'border-orange-500/20 bg-orange-500/10 text-orange-300' },
            { border: 'border-l-blue-500', badge: 'border-blue-500/20 bg-blue-500/10 text-blue-300' },
            { border: 'border-l-purple-500', badge: 'border-purple-500/20 bg-purple-500/10 text-purple-300' },
            { border: 'border-l-emerald-500', badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' },
        ][supersetColorIndex]
        : null;
    const unit = resolveWeightUnit(config);
    const unitLabel = unitLabelFor(unit);

    const isCardio = ex.muscle === 'CARDIO';
    const cardioMode: CardioType = ex.cardioType || ex.defaultCardioType || 'steady';
    const isInterval = cardioMode === 'hiit' || cardioMode === 'tabata';



    const historicalBest = useMemo(() => {
        if (!logs || isCardio || !ex.id) return null;

        if (ex.isIsometric) {
            let bestSec = 0;
            logs.forEach((log) => {
                if (log.skipped) return;
                const pastEx = log.exercises?.find((item) => item.id === ex.id);
                if (!pastEx) return;
                (pastEx.sets || []).forEach((set) => {
                    if (set.completed && set.duration) {
                        const sec = Number(set.duration);
                        if (sec > bestSec) bestSec = sec;
                    }
                });
            });
            if (bestSec === 0) return null;
            const minutes = Math.floor(bestSec / 60);
            const seconds = bestSec % 60;
            return minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${bestSec}s`;
        }

        if (ex.isBodyweight) {
            let bestReps = 0;
            let bestWeight = 0;
            logs.forEach((log) => {
                if (log.skipped) return;
                const pastEx = log.exercises?.find((item) => item.id === ex.id);
                if (!pastEx) return;
                (pastEx.sets || []).forEach((set) => {
                    if (set.completed && set.reps) {
                        const reps = Number(set.reps);
                        const weight = Number(set.weight) || 0;
                        if (reps > bestReps || (reps === bestReps && weight > bestWeight)) {
                            bestReps = reps;
                            bestWeight = weight;
                        }
                    }
                });
            });
            if (bestReps === 0) return null;
            return bestWeight > 0 ? `${bestReps} reps (+${formatWeight(bestWeight, unit, lang)}${unitLabel.toLowerCase()})` : `${bestReps} reps`;
        }

        let best1RM = 0;
        let bestStr = '';
        logs.forEach((log) => {
            if (log.skipped) return;
            const pastEx = log.exercises?.find((item) => item.id === ex.id);
            if (!pastEx) return;
            (pastEx.sets || []).forEach((set) => {
                if (set.completed && set.weight && set.reps) {
                    const e1rm = Number(set.weight) * (1 + Number(set.reps) / 30);
                    if (e1rm > best1RM) {
                        best1RM = e1rm;
                        bestStr = `${formatWeight(Number(set.weight), unit, lang)}${unitLabel.toLowerCase()} x ${set.reps} (1RM: ${Math.round(toDisplay(e1rm, unit))})`;
                    }
                }
            });
        });
        return best1RM > 0 ? bestStr : null;
    }, [logs, ex.id, isCardio, ex.isIsometric, ex.isBodyweight, unit, unitLabel, lang]);

    const regularSets = useMemo(() => ex.sets.filter((set) => set.type !== 'avt_hop'), [ex.sets]);
    const completedCount = regularSets.filter((set) => set.completed).length;
    const allDone = regularSets.length > 0 && completedCount === regularSets.length;
    const isSuperseted = !!ex.supersetId;
    const isLinkSource = linkingId === ex.instanceId;

    const overloadSuggest = useMemo(() => {
        if (!logs || isCardio || ex.isBodyweight || ex.isIsometric || !ex.id) return null;
        for (let i = logs.length - 1; i >= 0; i -= 1) {
            const log = logs[i];
            if (log.skipped) continue;
            const pastEx = log.exercises?.find((item) => item.id === ex.id);
            if (!pastEx) continue;
            const working = (pastEx.sets || []).filter((set: any) => set.type !== 'warmup' && set.type !== 'avt_hop');
            if (working.length === 0) return null;
            // Q15: full up/hold/down table with a reason line (null cases and
            // the no-range step match the legacy rule).
            return recommendProgression({
                sets: working,
                range: parseTargetReps(ex.targetReps),
                rirTarget: typeof config?.rpTargetRIR === 'number' ? config.rpTargetRIR : 2,
                unit,
            });
        }
        return null;
    }, [logs, ex.id, ex.targetReps, isCardio, ex.isBodyweight, ex.isIsometric, unit, config?.rpTargetRIR]);



    const prevCompletedRef = useRef(completedCount);
    const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (completedCount > prevCompletedRef.current) {
            if (completedCount === regularSets.length && regularSets.length > 0) {
                setExDoneFlash(true);
                triggerHaptic('success');
                playTimerFinishSound();
                if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
                flashTimerRef.current = setTimeout(() => setExDoneFlash(false), 1200);
            }
            const nextSet = regularSets.find((set) => !set.completed);
            if (nextSet) {
                if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
                scrollTimerRef.current = setTimeout(() => {
                    document.getElementById(`set-row-${nextSet.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 180);
            }
        }
        prevCompletedRef.current = completedCount;
        return () => {
            if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
            if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        };
    }, [completedCount, regularSets]);

    const isProtocol = !isCardio && !ex.isIsometric;
    const canWarmup = !ex.isBodyweight && !ex.isIsometric && !isCardio;
    const isEMOM = isProtocol && regularSets.length > 0 && regularSets.every((set) => set.type === 'emom');
    const isMyorep = isProtocol && regularSets.length > 0 && regularSets.every((set) => set.type === 'myorep' || set.type === 'myorep_match');
    const isCluster = isProtocol && regularSets.length > 0 && regularSets.every((set) => set.type === 'cluster');
    const isGiant = isProtocol && regularSets.length > 0 && regularSets.every((set) => set.type === 'giant');
    const hasTopBackoff = isProtocol && regularSets.some((set) => set.type === 'top') && regularSets.some((set) => set.type === 'backoff');
    const isTabata = isCardio && cardioMode === 'tabata';
    const isHIIT = isCardio && cardioMode === 'hiit';
    const isRestPause = isProtocol && regularSets.length > 0 && regularSets.every((set) => set.type === 'rest_pause');
    const isDrop = isProtocol && regularSets.length > 0 && regularSets.every((set) => set.type === 'drop');
    const isTimeVolume = isProtocol && regularSets.length > 0 && regularSets.every((set) => set.type === 'time_volume');
    const isTripleAdd = isProtocol && regularSets.length > 0 && regularSets.every((set) => set.type === 'triple_add');
    const isSpecialProtocol = isEMOM || isMyorep || isCluster || isGiant;
    const nextSetIdx = (!isSpecialProtocol && !isTabata && !isHIIT) ? regularSets.findIndex((set) => !set.completed) : -1;

    const setBadgeLabels = useMemo((): (string | undefined)[] => {
        if (isEMOM) return regularSets.map((_, index) => String(index + 1));
        if (isMyorep) return regularSets.map((_, index) => (index === 0 ? 'ACT' : `M${index}`));
        if (hasTopBackoff) {
            let backoffCount = 0;
            return regularSets.map((set) => (set.type === 'backoff' ? `B${++backoffCount}` : undefined));
        }
        return regularSets.map(() => undefined);
    }, [isEMOM, isMyorep, hasTopBackoff, regularSets]);

    const handleInjectWarmup = () => {
        const firstRegularSet = sets.find((set) => set.type === 'regular');
        const targetWeight = Number(firstRegularSet?.weight) || Number(firstRegularSet?.hintWeight) || 0;
        if (targetWeight === 0) return;

        const newSets: WorkoutSet[] = [
            { pct: 0.5, reps: 12 },
            { pct: 0.75, reps: 5 },
            { pct: 0.9, reps: 1 },
        ].map((step, index) => ({
            id: Date.now() + index,
            type: 'warmup',
            weight: roundWeight(targetWeight * step.pct),
            reps: step.reps,
            rpe: '',
            completed: false,
        }));

        onUpdateSession((prev: any) => !prev ? null : {
            ...prev,
            exercises: prev.exercises.map((item: any) =>
                item.instanceId === ex.instanceId ? { ...item, sets: [...newSets, ...item.sets] } : item
            ),
        });
        setOpenMenuId(null);
    };

    const handleCardioModeChange = (mode: CardioType) => {
        onUpdateSession((prev: any) => !prev ? null : {
            ...prev,
            exercises: prev.exercises.map((item: any) =>
                item.instanceId === ex.instanceId ? { ...item, cardioType: mode } : item
            ),
        });
        setOpenMenuId(null);
    };

    const confirmDelete = () => {
        onUpdateSession((prev: any) => prev ? {
            ...prev,
            exercises: prev.exercises.filter((item: any) => item.instanceId !== ex.instanceId),
        } : null);
        setOpenMenuId(null);
    };

    const handleSupersetAction = () => {
        if (ex.supersetId) {
            onUpdateSession((prev: any) => !prev ? null : {
                ...prev,
                exercises: prev.exercises.map((item: any) =>
                    item.supersetId === ex.supersetId ? { ...item, supersetId: undefined } : item
                ),
            });
            return;
        }

        if (isLinkSource) {
            onLink(null);
            return;
        }

        if (linkingId && linkingId !== ex.instanceId) {
            onUpdateSession((prev: any) => {
                if (!prev) return null;
                const source = prev.exercises.find((item: any) => item.instanceId === linkingId);
                const sharedSupersetId = source?.supersetId || `ss_${Date.now()}`;
                return {
                    ...prev,
                    exercises: prev.exercises.map((item: any) =>
                        item.instanceId === linkingId || item.instanceId === ex.instanceId
                            ? { ...item, supersetId: sharedSupersetId }
                            : item
                    ),
                };
            });
            onLink(null);
            return;
        }

        onLink(ex.instanceId);
    };

    const heroMetric = overloadSuggest
        ? {
            icon: overloadSuggest.action === 'up' ? 'TrendingUp' : overloadSuggest.action === 'down' ? 'TrendingDown' : 'Minus',
            label: formatProgressionReason(t.progression, overloadSuggest, unit, lang),
            tone: overloadSuggest.action === 'up' ? 'text-cyan-300' : overloadSuggest.action === 'down' ? 'text-amber-300' : 'text-zinc-300',
        }
        : historicalBest
            ? { icon: 'Trophy', label: historicalBest, tone: 'text-amber-300' }
            : null;


    return {
        ex,
        onSetUpdate,
        onSetComplete,
        onSetTypeChange,
        onAddSet,
        onDeleteSet,
        onOpenDetail,
        onLink,
        onReplace,
        onEditMuscle,
        onUpdateSession,
        onOpenWarmup,
        openMenuId,
        setOpenMenuId,
        linkingId,
        t,
        lang,
        supersetColorIndex,
        isLinkingTarget,
        config,
        stageConfig,
        dragEnabled,
        logs,
        tutorialId,
        isExpanded,
        onToggleExpand,
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        exDoneFlash,
        setExDoneFlash,
        activeEmomMinute,
        setActiveEmomMinute,
        style,
        sets,
        c,
        ssStyle,
        unit,
        unitLabel,
        isCardio,
        cardioMode,
        isInterval,
        historicalBest,
        regularSets,
        completedCount,
        allDone,
        isSuperseted,
        isLinkSource,
        overloadSuggest,
        prevCompletedRef,
        flashTimerRef,
        scrollTimerRef,
        isProtocol,
        canWarmup,
        isEMOM,
        isMyorep,
        isCluster,
        isGiant,
        hasTopBackoff,
        isTabata,
        isHIIT,
        isRestPause,
        isDrop,
        isTimeVolume,
        isTripleAdd,
        isSpecialProtocol,
        nextSetIdx,
        setBadgeLabels,
        handleInjectWarmup,
        handleCardioModeChange,
        confirmDelete,
        handleSupersetAction,
        heroMetric,
    };
};

export type ExerciseCardState = ReturnType<typeof useSortableExerciseCardState>;
