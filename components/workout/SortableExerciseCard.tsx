import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SessionExercise, WorkoutSet, CardioType, SetType } from '../../types';
import { Icon } from '../ui/Icon';
import { MuscleTag } from './MuscleTag';
import { ExerciseCardStats } from './ExerciseCardStats';
import { ExerciseCardMenu } from './ExerciseCardMenu';
import { ExerciseCardSets } from './ExerciseCardSets';
import { getTranslated, roundWeight } from '../../utils';
import { triggerHaptic, playTimerFinishSound } from '../../utils/audio';

interface SortableExerciseCardProps {
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
    logs: import('../../types').Log[];
    tutorialId?: string;
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
}: SortableExerciseCardProps) => {
    const [exDoneFlash, setExDoneFlash] = useState(false);

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
        position: 'relative' as const,
        contentVisibility: 'auto' as const,
        containIntrinsicSize: '500px',
        contain: 'layout paint style' as const,
    };

    const sets = ex.sets || [];
    const ssStyle = typeof supersetColorIndex === 'number'
        ? [
            { border: 'border-l-orange-500', badge: 'border-orange-500/20 bg-orange-500/10 text-orange-300' },
            { border: 'border-l-blue-500', badge: 'border-blue-500/20 bg-blue-500/10 text-blue-300' },
            { border: 'border-l-purple-500', badge: 'border-purple-500/20 bg-purple-500/10 text-purple-300' },
            { border: 'border-l-emerald-500', badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' },
        ][supersetColorIndex]
        : null;
    const unit = 'kg' as const;
    const unitLabel = 'KG';

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
            return bestWeight > 0 ? `${bestReps} reps (+${bestWeight}kg)` : `${bestReps} reps`;
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
                        bestStr = `${set.weight}${unitLabel.toLowerCase()} x ${set.reps} (1RM: ${Math.round(e1rm)})`;
                    }
                }
            });
        });
        return best1RM > 0 ? bestStr : null;
    }, [logs, ex.id, isCardio, ex.isIsometric, ex.isBodyweight, unitLabel]);

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
            if (!working.every((set: any) => set.completed)) return null;
            const avgWeight = working.reduce((sum: number, set: any) => sum + Number(set.weight || 0), 0) / working.length;
            if (avgWeight <= 0) return null;
            const target = ex.targetReps ? parseInt(String(ex.targetReps), 10) : null;
            if (!target) return { kg: 2.5 };
            return working.every((set: any) => Number(set.reps) >= target) ? { kg: 2.5 } : null;
        }
        return null;
    }, [logs, ex.id, ex.targetReps, isCardio, ex.isBodyweight, ex.isIsometric]);



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
    const isEMOM = isProtocol && regularSets.length > 0 && regularSets.every((set) => set.type === 'emom');
    const isMyorep = isProtocol && regularSets.length > 0 && regularSets.every((set) => set.type === 'myorep' || set.type === 'myorep_match');
    const isCluster = isProtocol && regularSets.length > 0 && regularSets.every((set) => set.type === 'cluster');
    const isGiant = isProtocol && regularSets.length > 0 && regularSets.every((set) => set.type === 'giant');
    const hasTopBackoff = isProtocol && regularSets.some((set) => set.type === 'top') && regularSets.some((set) => set.type === 'backoff');
    const isTabata = isCardio && cardioMode === 'tabata';
    const isHIIT = isCardio && cardioMode === 'hiit';
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
            icon: 'TrendingUp',
            label: lang === 'es' ? `+${overloadSuggest.kg} kg sugerido` : `+${overloadSuggest.kg} kg suggested`,
            tone: 'text-cyan-300',
        }
        : historicalBest
            ? { icon: 'Trophy', label: historicalBest, tone: 'text-amber-300' }
            : null;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                flex flex-col overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#141416] shadow-[0_16px_40px_-24px_rgba(0,0,0,0.9)] transition-all
                ${ssStyle ? `border-l-4 ${ssStyle.border}` : ''}
                ${isDragging ? 'scale-[1.02] shadow-2xl ring-2 ring-red-500/20' : ''}
                ${isLinkSource ? 'ring-2 ring-amber-400/40 shadow-[0_0_0_1px_rgba(251,191,36,0.15)]' : ''}
                ${isLinkingTarget ? 'ring-2 ring-cyan-400/30 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]' : ''}
                ${allDone ? 'shadow-[0_20px_50px_-24px_rgba(34,197,94,0.32)]' : ''}
                
            `}
        >
            <div className="border-b border-white/5 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_55%)] px-3 pb-2 pt-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5">
                            {dragEnabled && (
                                <div
                                    className="mr-0.5 -ml-2 rounded-full p-1.5 text-zinc-500 touch-none cursor-grab active:cursor-grabbing hover:text-zinc-200"
                                    {...attributes}
                                    {...listeners}
                                >
                                    <Icon name="GripVertical" size={16} />
                                </div>
                            )}

                            <MuscleTag label={String(ex.slotLabel || ex.muscle || 'CHEST')} />

                            {isCardio ? (
                                <span className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                                    {String(t.cardioModes?.[cardioMode] || cardioMode)}
                                </span>
                            ) : ex.targetReps ? (
                                <span className="inline-flex items-center rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-300">
                                    {String(ex.targetReps)} Reps
                                </span>
                            ) : null}

                            {ex.isBodyweight && (
                                <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-300">
                                    BW
                                </span>
                            )}

                            {isSuperseted && (
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] ${ssStyle?.badge || 'border-violet-500/20 bg-violet-500/10 text-violet-300'}`}>
                                    SS
                                </span>
                            )}
                        </div>

                        <h3
                            onClick={(event) => {
                                event.stopPropagation();
                                if (onOpenDetail) onOpenDetail(ex);
                            }}
                            className="cursor-pointer truncate pl-0.5 text-[1.15rem] font-black leading-none tracking-[-0.04em] text-white transition-colors hover:text-primary-400"
                        >
                            {String(getTranslated(ex.name, lang))}
                        </h3>

                        {(heroMetric || isLinkSource || isLinkingTarget) && (
                            <div className="flex flex-wrap items-center gap-1.5 pl-0.5">
                                {heroMetric && (
                                    <div className={`inline-flex max-w-full items-center gap-1 rounded-full px-1 py-0.5 text-[10px] font-semibold ${heroMetric.tone}`}>
                                        <Icon name={heroMetric.icon} size={10} />
                                        <span className="truncate">{heroMetric.label}</span>
                                    </div>
                                )}

                                {isLinkSource && (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onLink(null);
                                        }}
                                        className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-amber-200 transition-colors hover:bg-amber-500/15"
                                    >
                                        <Icon name="Link" size={10} />
                                        <span>{lang === 'es' ? 'Elige pareja' : 'Pick pair'}</span>
                                    </button>
                                )}

                                {isLinkingTarget && (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            handleSupersetAction();
                                        }}
                                        className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-200 transition-colors hover:bg-cyan-500/15"
                                    >
                                        <Icon name="Link" size={10} />
                                        <span>{lang === 'es' ? 'Unir aqui' : 'Pair here'}</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                handleSupersetAction();
                            }}
                            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${isSuperseted ? 'border-violet-500/30 bg-violet-500/15 text-violet-200' : isLinkSource ? 'border-amber-400/30 bg-amber-500/15 text-amber-200' : 'border-white/8 bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white'}`}
                            aria-label={isSuperseted ? (lang === 'es' ? 'Quitar superserie' : 'Remove superset') : (lang === 'es' ? 'Crear superserie' : 'Create superset')}
                        >
                            <Icon name={isSuperseted ? 'Unlink' : 'Link'} size={15} />
                        </button>

                        <div className="relative">
                            <button
                                aria-label={lang === 'es' ? 'Mas opciones' : 'More options'}
                                aria-haspopup="menu"
                                aria-expanded={openMenuId === ex.instanceId}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenMenuId(openMenuId === ex.instanceId ? null : ex.instanceId);
                                }}
                                className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-fast ease-natural ${openMenuId === ex.instanceId ? 'border-white/10 bg-white/10 text-white' : 'border-white/8 bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white'}`}
                            >
                                <Icon name="MoreVertical" size={18} />
                            </button>

                            <ExerciseCardMenu
                                ex={ex}
                                isOpen={openMenuId === ex.instanceId}
                                onClose={() => setOpenMenuId(null)}
                                isCardio={isCardio}
                                cardioMode={cardioMode}
                                hasSuperset={!!ssStyle}
                                isLinking={isLinkSource}
                                onOpenDetail={onOpenDetail}
                                onCardioModeChange={handleCardioModeChange}
                                onInjectWarmup={handleInjectWarmup}
                                onSupersetAction={handleSupersetAction}
                                onReplace={onReplace}
                                onRequestDelete={confirmDelete}
                                t={t}
                                lang={lang}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-2.5">
                    <ExerciseCardStats
                        completedCount={completedCount}
                        totalSets={regularSets.length}
                    />
                </div>

            </div>

            <ExerciseCardSets
                ex={ex}
                regularSets={regularSets}
                isCardio={isCardio}
                isInterval={isInterval}
                cardioMode={cardioMode}
                unit={unit}
                unitLabel={unitLabel}
                isEMOM={isEMOM}
                isMyorep={isMyorep}
                isCluster={isCluster}
                isSpecialProtocol={isSpecialProtocol}
                activeEmomMinute={0}
                nextSetIdx={nextSetIdx}
                setBadgeLabels={setBadgeLabels}
                onSetUpdate={onSetUpdate}
                onSetComplete={onSetComplete}
                onSetTypeChange={onSetTypeChange}
                config={config}
                stageConfig={stageConfig}
                t={t}
                lang={lang}
                tutorialId={tutorialId}
            />

            {exDoneFlash && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.35rem] bg-green-500/5 ring-2 ring-green-500/60 pointer-events-none animate-in fade-in duration-150">
                    <div className="animate-bounce rounded-full bg-green-500 px-3 py-1.5 text-xs font-black text-white shadow-lg shadow-green-500/30">
                        <Icon name="CheckCircle" size={14} className="mr-1 inline" />
                        {lang === 'es' ? 'Listo' : 'Done'}
                    </div>
                </div>
            )}

            <div className="grid shrink-0 grid-cols-2 divide-x divide-white/10 border-t border-white/5 bg-black/20">
                <button
                    onClick={() => sets.length > 0 && onDeleteSet(ex.instanceId, sets[sets.length - 1].id)}
                    disabled={sets.length <= 1}
                    className="flex w-full items-center justify-center gap-2 py-2.5 text-[11px] font-bold text-zinc-500 transition-colors active:scale-95 hover:text-red-400 disabled:opacity-25"
                >
                    <Icon name="Minus" size={13} /> {String(t.removeSetBtn)}
                </button>
                <button
                    onClick={() => onAddSet(ex.instanceId)}
                    className="flex w-full items-center justify-center gap-2 py-2.5 text-[11px] font-bold text-zinc-500 transition-colors active:scale-95 hover:text-white"
                >
                    <Icon name="Plus" size={13} /> {t.addSetBtn}
                </button>
            </div>
        </div>
    );
});
