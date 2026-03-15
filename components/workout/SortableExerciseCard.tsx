
import React, { useMemo, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SessionExercise, WorkoutSet, CardioType, SetType } from '../../types';
import { Icon } from '../ui/Icon';
import { MuscleTag } from './MuscleTag';
import { SetRow } from './SetRow';
import { AVTRoundCard } from './AVTRoundCard';
import { getTranslated, roundWeight } from '../../utils';
import { useApp } from '../../context/AppContext';

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
    onEditMuscle,
    onConfigPlate,
    onUpdateSession,
    onOpenWarmup,
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
    tutorialId,
    onMarkLastHop,
    onAddHopToRound,
    onAddAVTRound
}: SortableExerciseCardProps) => {
    const { logs } = useApp();
    const [isDeleting, setIsDeleting] = useState(false);

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

    // 2. Calculate Historical Best PR (1RM)
    const historicalBest = useMemo(() => {
        if (!logs || isCardio || !ex.id) return null;
        let best1RM = 0;
        let bestStr = '';

        // Scan backwards is slightly more optimal but for precision we scan all
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
    }, [logs, ex.id, isCardio, unitLabel]);

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
    const regularSets = ex.sets.filter(s => s.type !== 'avt_hop');

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
        <div
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

                    <div className="flex items-center gap-2">
                        {!isCardio && (
                            <button
                                id={tutorialId ? "tut-warmup-btn" : undefined}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Use modal if handler provided (preferable for feedback), otherwise try internal auto-inject
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
                            <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === ex.instanceId ? null : ex.instanceId); setIsDeleting(false); }} className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
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

                {historicalBest && (
                    <div className="flex items-start gap-1.5 mb-1.5 px-1 mt-1">
                        <Icon name="Trophy" size={11} className="mt-0.5 text-yellow-500 shrink-0" />
                        <p className="text-[10px] font-bold text-yellow-500/90 leading-snug">
                            {lang === 'en' ? 'Best:' : 'Mejor:'} {historicalBest}
                        </p>
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
            </div>

            {/* Sets Header - Use GAP-2 for mobile breathing room */}
            <div className="grid grid-cols-12 gap-2 px-2 py-2 bg-zinc-50 dark:bg-black/20 border-b border-zinc-100 dark:border-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center items-center">
                <div className="col-span-1">#</div>
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
                ) : (
                    <>
                        <div className="col-span-4 text-center">
                            {ex.isBodyweight ? "BW + KG" : `${String(t.weight)} (${unitLabel})`}
                        </div>
                        <div className="col-span-4 text-center">{String(t.reps)}</div>
                        {config.showRIR && <div className="col-span-2 text-center">{String(t.rir)}</div>}
                        {!config.showRIR && <div className="col-span-2"></div>}
                    </>
                )}
                <div className="col-span-1"></div>
            </div>

            {/* Sets List */}
            <div className={`divide-y divide-zinc-100 dark:divide-white/5 ${viewMode === 'focus' ? 'overflow-y-auto flex-1' : ''}`}>
                {!isAVTExercise && regularSets.map((set, idx) => (
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
                        tutorialId={idx === 0 ? tutorialId : undefined} // Only pass to first set if provided
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
        </div>
    );
});
