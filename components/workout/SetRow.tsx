
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { WorkoutSet, SetType } from '../../types';
import { Icon } from '../ui/Icon';
import { triggerHaptic } from '../../utils/audio';

interface SetRowProps {
    set: WorkoutSet;
    exInstanceId: number;
    onUpdate: (exId: number, setId: number, field: string, value: any) => void;
    onToggleComplete: (exId: number, setId: number) => void;
    onChangeType: (exId: number, setId: number, type: SetType) => void;
    lang: 'en' | 'es';
    isCardio?: boolean;
    isBodyweight?: boolean;
    isIsometric?: boolean;
    isometricTargetSecs?: number;  // countdown mode for isometric
    setIndex?: number;
    badgeLabel?: string;
    tutorialId?: string;
    disableTypeChange?: boolean;
    isActiveProtocolSet?: boolean;
    isNextSet?: boolean;
    showRIR?: boolean;
}

const getTypeColor = (type: SetType) => {
    switch (type) {
        case 'warmup':       return 'bg-zinc-800 text-zinc-400 border-zinc-700';
        case 'myorep':       
        case 'myorep_match': 
        case 'top':          
        case 'backoff':      
        case 'cluster':      
        case 'giant':        
        case 'avt_hop':      
        case 'emom':         
        case 'drop':         
        case 'rest_pause':   
        case 'time_volume':  
        case 'triple_add':   return 'bg-[#1A1A1A] text-zinc-300 border-zinc-700/70';
        default:             return 'bg-[#121212] text-zinc-400 border-zinc-800';
    }
};

const getRowAccent = (type: SetType): string => {
    switch (type) {
        case 'warmup': return 'bg-[#18181c]';
        case 'drop': return 'bg-[#1c1816]';
        case 'myorep':
        case 'myorep_match': return 'bg-[#18141f]';
        case 'emom': return 'bg-[#131b1f]';
        default: return 'bg-[#17171b]';
    }
};

const getBorderAccent = (type: SetType): string => {
    switch (type) {
        case 'warmup': return 'border border-amber-500/10';
        case 'drop': return 'border border-orange-500/10';
        case 'myorep':
        case 'myorep_match': return 'border border-fuchsia-500/12';
        case 'emom': return 'border border-cyan-500/12';
        default: return 'border border-zinc-800/90';
    }
};

const getTypeLabel = (type: SetType) => {
    const map: Record<string, string> = {
        regular: '•',
        warmup: 'W',
        myorep: 'M',
        myorep_match: 'MM',
        giant: 'G',
        top: 'T',
        backoff: 'B',
        cluster: 'C',
        avt_hop: 'H',
        emom: 'E',
        drop: 'D',
        rest_pause: 'RP',
        time_volume: 'TV',
        triple_add: 'TA',
    };
    return map[type] || '•';
};

// Hold timer
const HoldTimer: React.FC<{
    initialSeconds: number;
    targetSeconds?: number;   // If set -> countdown mode
    onSave: (seconds: number) => void;
    lang: 'en' | 'es';
    isDone: boolean;
}> = ({ initialSeconds, targetSeconds, onSave, lang, isDone }) => {
    const [elapsed, setElapsed] = useState(initialSeconds);
    const [running, setRunning] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const baseElapsedRef = useRef(initialSeconds);

    const start = useCallback(() => {
        if (running) return;
        triggerHaptic('medium');
        setRunning(true);
        startTimeRef.current = Date.now();
        intervalRef.current = setInterval(() => {
            const now = Date.now();
            const delta = Math.floor((now - startTimeRef.current!) / 1000);
            setElapsed(baseElapsedRef.current + delta);
        }, 1000);
    }, [running]);

    const stop = useCallback(() => {
        if (!running) return;
        triggerHaptic('medium');
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunning(false);
        const finalElapsed = elapsed;
        baseElapsedRef.current = finalElapsed;
        onSave(finalElapsed);
    }, [running, elapsed, onSave]);

    const reset = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunning(false);
        setElapsed(0);
        baseElapsedRef.current = 0;
        onSave(0);
    }, [onSave]);

    useEffect(() => {
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`;
    };

    // Countdown display: timeRemaining counts down from target
    const timeRemaining = targetSeconds ? Math.max(0, targetSeconds - elapsed) : null;
    const countdownPct = targetSeconds ? Math.min(100, (elapsed / targetSeconds) * 100) : 0;
    const countdownUrgent = timeRemaining !== null && timeRemaining <= 5 && running;

    if (isDone) {
        return (
            <div className="flex items-center justify-center gap-1 text-green-400">
                <Icon name="Timer" size={13} />
                <span className="text-sm font-black tabular-nums">{formatTime(elapsed)}</span>
                {targetSeconds && <span className="text-[9px] text-green-600">/ {formatTime(targetSeconds)}</span>}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5 w-full">
            {/* Time Display */}
            <div className={`min-w-[52px] text-center text-xl font-black tabular-nums transition-colors ${
                countdownUrgent ? 'text-orange-400 animate-pulse'
                : running ? 'text-violet-400 animate-pulse'
                : elapsed > 0 ? 'text-white' : 'text-zinc-600'
            }`}>
                {timeRemaining !== null ? formatTime(timeRemaining) : formatTime(elapsed)}
            </div>
            {/* Countdown progress bar */}
            {targetSeconds && (
                <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-200 ${countdownUrgent ? 'bg-orange-400' : 'bg-violet-500'}`}
                        style={{ width: `${countdownPct}%` }} />
                </div>
            )}

            {/* Controls */}
            <div className="flex gap-1">
                {!running ? (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); start(); }}
                        className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center active:scale-90 transition-transform border border-violet-500/30"
                        aria-label={lang === 'es' ? 'Iniciar timer' : 'Start timer'}
                    >
                        <Icon name="Play" size={15} fill="currentColor" />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); stop(); }}
                        className="w-9 h-9 rounded-xl bg-violet-500 text-white flex items-center justify-center active:scale-90 transition-transform animate-pulse-slow"
                        aria-label={lang === 'es' ? 'Detener timer' : 'Stop timer'}
                    >
                        <Icon name="Square" size={14} fill="currentColor" />
                    </button>
                )}
                {elapsed > 0 && !running && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); reset(); }}
                        className="w-7 h-9 flex items-center justify-center text-zinc-600 hover:text-zinc-400 active:scale-90 transition-all"
                        aria-label={lang === 'es' ? 'Reiniciar timer' : 'Reset timer'}
                    >
                        <Icon name="RotateCcw" size={13} />
                    </button>
                )}
            </div>
        </div>
    );
};

// Main SetRow
export const SetRow = React.memo(({
    set, exInstanceId,
    onUpdate, onToggleComplete, onChangeType,
    lang, isCardio, isBodyweight, isIsometric, isometricTargetSecs,
    setIndex, badgeLabel, tutorialId, disableTypeChange, isActiveProtocolSet, isNextSet, showRIR = false
}: SetRowProps) => {
    const isDone = set.completed;
    const setType = set.type || 'regular';
    // For regular sets: show the set number (1-based index) instead of the
    // opaque bullet glyph gives instant orientation ("I'm on set 2 of 3").
    // For typed sets (warmup, myorep, drop...): keep the type letter badge.
    const effectiveBadgeLabel = badgeLabel
        ?? (setType === 'regular' && setIndex != null
            ? String(setIndex + 1)
            : getTypeLabel(setType));
    const rowAccent = isDone
        ? 'bg-emerald-500/12 ring-1 ring-inset ring-emerald-400/15'
        : isActiveProtocolSet
            ? 'bg-cyan-500/10 ring-1 ring-inset ring-cyan-400/25'
            : isNextSet
                ? 'bg-amber-400/12 ring-1 ring-inset ring-amber-300/20'
                : getRowAccent(setType);

    const [localWeight, setLocalWeight] = useState(set.weight ?? '');
    const [localReps, setLocalReps] = useState(set.reps ?? '');
    const [localRpe, setLocalRpe] = useState(set.rpe ?? '');
    const [showExtraWeight, setShowExtraWeight] = useState(
        isBodyweight && (Number(set.weight) > 0 || Number(set.hintWeight) > 0)
    );
    // Swipe-to-complete
    const [swipePct, setSwipePct] = useState(0);
    const swipeRef = useRef({ startX: 0, startY: 0, tracking: false, locked: false });

    const activeFieldRef = useRef<string | null>(null);
    const weightRef = useRef<HTMLInputElement>(null);
    const repsRef = useRef<HTMLInputElement>(null);
    const extraWeightRef = useRef<HTMLInputElement>(null);
    const commitTimersRef = useRef<Partial<Record<'weight' | 'reps' | 'rpe', ReturnType<typeof setTimeout>>>>({});

    useEffect(() => { if (activeFieldRef.current !== 'weight') setLocalWeight(set.weight ?? ''); }, [set.weight]);
    useEffect(() => { if (activeFieldRef.current !== 'reps') setLocalReps(set.reps ?? ''); }, [set.reps]);
    useEffect(() => { if (activeFieldRef.current !== 'rpe') setLocalRpe(set.rpe ?? ''); }, [set.rpe]);
    // Reset swipe when set state changes
    useEffect(() => { setSwipePct(0); swipeRef.current.tracking = false; swipeRef.current.locked = false; }, [set.completed]);
    useEffect(() => () => {
        Object.values(commitTimersRef.current).forEach((timer) => {
            if (timer) clearTimeout(timer);
        });
    }, []);

    const commitChange = useCallback((field: string, value: any) => {
        if (value != set[field as keyof WorkoutSet]) {
            onUpdate(exInstanceId, set.id, field, value);
        }
    }, [exInstanceId, onUpdate, set]);

    const flushScheduledCommit = useCallback((field: 'weight' | 'reps' | 'rpe', value: any) => {
        const existing = commitTimersRef.current[field];
        if (existing) {
            clearTimeout(existing);
            delete commitTimersRef.current[field];
        }
        commitChange(field, value);
    }, [commitChange]);

    const scheduleCommit = useCallback((field: 'weight' | 'reps' | 'rpe', value: any, delay = 180) => {
        const existing = commitTimersRef.current[field];
        if (existing) clearTimeout(existing);
        commitTimersRef.current[field] = setTimeout(() => {
            delete commitTimersRef.current[field];
            commitChange(field, value);
        }, delay);
    }, [commitChange]);

    const flushPendingFields = useCallback(() => {
        Object.values(commitTimersRef.current).forEach((timer) => {
            if (timer) clearTimeout(timer);
        });
        commitTimersRef.current = {};

        if (localWeight != set.weight) {
            onUpdate(exInstanceId, set.id, 'weight', localWeight);
        }
        if (localReps != set.reps) {
            onUpdate(exInstanceId, set.id, 'reps', localReps);
        }
        if (showRIR && localRpe != set.rpe) {
            onUpdate(exInstanceId, set.id, 'rpe', localRpe);
        }
    }, [exInstanceId, localReps, localRpe, localWeight, onUpdate, set.id, set.reps, set.rpe, set.weight, showRIR]);

    const handleToggleComplete = useCallback(() => {
        flushPendingFields();
        triggerHaptic(isDone ? 'light' : 'medium');
        onToggleComplete(exInstanceId, set.id);
    }, [flushPendingFields, isDone, onToggleComplete, exInstanceId, set.id]);

    const handleWeightKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            repsRef.current?.focus();
        }
    };

    const handleWeightBlur = (value: any) => {
        activeFieldRef.current = null;
        flushScheduledCommit('weight', value);
    };

    const handleBlur = (field: string, value: any) => {
        activeFieldRef.current = null;
        flushScheduledCommit(field as 'weight' | 'reps' | 'rpe', value);
    };
    // Swipe-to-complete handlers
    const onSwipeTouchStart = useCallback((e: React.TouchEvent) => {
        if (isDone || !e.touches?.[0]) return;
        swipeRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, tracking: true, locked: false };
    }, [isDone]);

    const onSwipeTouchMove = useCallback((e: React.TouchEvent) => {
        const s = swipeRef.current;
        if (!s.tracking || isDone || s.locked || !e.touches?.[0]) return;
        const dx = e.touches[0].clientX - s.startX;
        const dy = e.touches[0].clientY - s.startY;
        // Cancel if vertical gesture dominates (user is scrolling)
        if (Math.abs(dy) > Math.abs(dx) * 1.3 && Math.abs(dx) < 15) {
            s.tracking = false;
            setSwipePct(0);
            return;
        }
        if (dx > 0) {
            const pct = Math.min(100, (dx / 90) * 100);
            setSwipePct(pct);
        }
    }, [isDone]);

    const onSwipeTouchEnd = useCallback(() => {
        if (swipePct >= 85 && !isDone) {
            swipeRef.current.locked = true;
            flushPendingFields();
            triggerHaptic('success');
            onToggleComplete(exInstanceId, set.id);
        }
        setSwipePct(0);
        swipeRef.current.tracking = false;
    }, [swipePct, isDone, flushPendingFields, exInstanceId, set.id, onToggleComplete]);

    const handleHoldSave = useCallback((seconds: number) => {
        onUpdate(exInstanceId, set.id, 'duration', seconds);
    }, [exInstanceId, set.id, onUpdate]);

    const focusPrimaryField = useCallback(() => {
        if (isDone || isIsometric) return;

        if (isBodyweight && !isCardio) {
            if (!String(localReps ?? '').trim()) {
                repsRef.current?.focus();
                return;
            }
            if (showExtraWeight) {
                extraWeightRef.current?.focus();
                return;
            }
            repsRef.current?.focus();
            return;
        }

        if (!String(localWeight ?? '').trim()) {
            weightRef.current?.focus();
            return;
        }
        repsRef.current?.focus();
    }, [isBodyweight, isCardio, isDone, isIsometric, localReps, localWeight, showExtraWeight]);

    const handleRowClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement;
        if (target.closest('button, input, textarea, select, a')) return;
        focusPrimaryField();
    }, [focusPrimaryField]);

    const inputBaseClass = "h-[38px] w-full rounded-[9px] bg-surface-elevated text-center text-[15px] font-semibold text-zinc-200 outline-none transition-colors border border-transparent focus:border-primary-500 focus:bg-surface-raised tabular-nums";
    const inputActiveClass = "h-[38px] w-full rounded-[9px] bg-surface-raised border border-primary-500/70 text-center text-[15px] font-semibold text-white outline-none focus:border-primary-500 tabular-nums shadow-sm";
    const inputDoneClass = "h-[38px] w-full rounded-[9px] bg-transparent text-center text-[15px] font-semibold text-primary-400 outline-none tabular-nums";
    const currentInputClass = isDone ? inputDoneClass : isNextSet ? inputActiveClass : inputBaseClass;

    const rowClass = `relative rounded-[12px] transition-all duration-150 ${
        isDone
            ? 'bg-primary-500/10 border border-primary-500/25'
            : isNextSet
            ? 'bg-[#1b1b20] border border-primary-500/50 shadow-sm'
            : 'bg-surface-raised border border-border-subtle'
    }`;

    const checkBtnClass = `flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full transition-all duration-150 active:scale-90 ${
        isDone
            ? 'bg-primary-500 text-zinc-950 font-black shadow-sm'
            : 'border border-zinc-700 bg-surface-elevated text-zinc-500 hover:border-zinc-500 hover:text-white'
    }`;

    const weightPlaceholder = set.hintWeight ? String(set.hintWeight) : '0';
    const repsPlaceholder = set.hintReps ? String(set.hintReps) : '0';
    const prescriptionHint = set.prescribedReps !== undefined
        ? (set.prescribedReps === 'FAILURE'
            ? (lang === 'es' ? 'OBJ: AL FALLO' : 'TARGET: FAILURE')
            : `OBJ: ${set.prescribedReps}${set.targetRpe !== undefined ? ` · RPE ${set.targetRpe}` : ''}`)
        : null;

    const prevText = useMemo(() => {
        if (isIsometric) {
            if (set.duration) return `${set.duration}s`;
            return '—';
        }
        if (isBodyweight) {
            if (set.prevReps) {
                return set.prevWeight && Number(set.prevWeight) > 0 ? `+${set.prevWeight}k` : `${set.prevReps}`;
            }
            return set.hintReps ? String(set.hintReps) : '—';
        }
        if (set.prevReps || set.prevWeight) {
            if (set.prevReps && set.prevWeight) return `${set.prevWeight}k`;
            return String(set.prevReps || set.prevWeight);
        }
        if (set.hintReps || set.hintWeight) {
            return String(set.hintReps || set.hintWeight);
        }
        return '—';
    }, [isBodyweight, isIsometric, set.duration, set.hintReps, set.hintWeight, set.prevReps, set.prevWeight]);

    const BadgeEl = disableTypeChange || isDone ? 'div' : 'button';
    const badgeProps = (!disableTypeChange && !isDone)
        ? { id: tutorialId, onClick: () => onChangeType(exInstanceId, set.id, setType) }
        : { id: tutorialId };
    const badgeClass = `flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
        isDone
            ? 'bg-primary-500 text-zinc-950'
            : isNextSet
            ? 'bg-surface-elevated text-white border border-primary-500/60'
            : 'bg-surface-elevated text-muted border border-border-subtle'
    } ${!disableTypeChange && !isDone ? 'cursor-pointer active:scale-90' : 'cursor-default'}`;

    const SwipeOverlay = swipePct > 0 ? (
        <div className="absolute inset-y-0 left-0 rounded-xl bg-green-500/20 pointer-events-none transition-none flex items-center justify-start pl-3"
            style={{ width: `${swipePct}%` }}>
            {swipePct > 50 && <Icon name="Check" size={16} className="text-green-400" strokeWidth={3} />}
        </div>
    ) : null;

    // ISOMETRIC MODE
    if (isIsometric) {
        return (
            <div id={`set-row-${set.id}`}
                onTouchStart={onSwipeTouchStart} onTouchMove={onSwipeTouchMove} onTouchEnd={onSwipeTouchEnd}
                className={rowClass}>
                {SwipeOverlay}
                <div className="grid grid-cols-[28px_44px_1fr_36px] gap-2 items-center px-2.5 py-1.5">
                    <div className="flex justify-center">
                        <BadgeEl {...badgeProps as any} className={badgeClass}>
                            {effectiveBadgeLabel}
                        </BadgeEl>
                    </div>
                    <div className="text-center text-[12px] text-muted tabular-nums truncate font-medium">
                        {prevText}
                    </div>
                    <div className="flex items-center justify-center">
                        <HoldTimer
                            initialSeconds={Number(set.duration) || 0}
                            targetSeconds={isometricTargetSecs}
                            onSave={handleHoldSave}
                            lang={lang}
                            isDone={isDone}
                        />
                    </div>
                    <div className="flex justify-center">
                        <button
                            onClick={handleToggleComplete}
                            className={checkBtnClass}
                            aria-pressed={Boolean(isDone)}
                            aria-label={lang === 'es' ? (isDone ? 'Serie completada' : 'Completar serie') : (isDone ? 'Set completed' : 'Complete set')}
                        >
                            <Icon name="Check" size={17} strokeWidth={isDone ? 3 : 2.5} />
                        </button>
                    </div>
                </div>
                {prescriptionHint && !isDone && (
                    <div className="flex justify-center pb-1 -mt-0.5">
                        <span className="text-[10px] font-bold tracking-wide text-primary-400">{prescriptionHint}</span>
                    </div>
                )}
            </div>
        );
    }

    // BODYWEIGHT MODE
    if (isBodyweight && !isCardio) {
        return (
            <div id={`set-row-${set.id}`}
                onTouchStart={onSwipeTouchStart} onTouchMove={onSwipeTouchMove} onTouchEnd={onSwipeTouchEnd}
                onClick={handleRowClick}
                className={rowClass}>
                {SwipeOverlay}
                <div className={`grid ${showRIR ? 'grid-cols-[28px_38px_1fr_1fr_38px_36px]' : 'grid-cols-[28px_44px_1fr_1fr_36px]'} items-center gap-2 px-2.5 py-1.5`}>
                    <div className="flex justify-center">
                        <BadgeEl {...badgeProps as any} className={badgeClass}>
                            {effectiveBadgeLabel}
                        </BadgeEl>
                    </div>
                    <div className="text-center text-[12px] text-muted tabular-nums truncate font-medium">
                        {prevText}
                    </div>
                    <div>
                        <input
                            ref={extraWeightRef}
                            type="number" inputMode="decimal"
                            className={currentInputClass}
                            placeholder={weightPlaceholder}
                            value={localWeight}
                            onChange={e => {
                                setLocalWeight(e.target.value);
                                scheduleCommit('weight', e.target.value, 180);
                            }}
                            onKeyDown={handleWeightKeyDown}
                            onBlur={() => handleWeightBlur(localWeight)}
                            onFocus={() => activeFieldRef.current = 'weight'}
                            enterKeyHint="next"
                        />
                    </div>
                    <div>
                        <input
                            ref={repsRef}
                            type="number" inputMode="numeric"
                            className={currentInputClass}
                            placeholder={repsPlaceholder}
                            value={localReps}
                            onChange={e => {
                                setLocalReps(e.target.value);
                                scheduleCommit('reps', e.target.value, 180);
                            }}
                            onBlur={() => handleBlur('reps', localReps)}
                            onFocus={() => activeFieldRef.current = 'reps'}
                            enterKeyHint="done"
                        />
                    </div>
                    {showRIR && (
                        <div>
                            <input
                                type="number" inputMode="decimal"
                                className={currentInputClass}
                                placeholder="RIR"
                                value={localRpe}
                                onChange={e => {
                                    setLocalRpe(e.target.value);
                                    scheduleCommit('rpe', e.target.value, 180);
                                }}
                                onBlur={() => handleBlur('rpe', localRpe)}
                                enterKeyHint="done"
                            />
                        </div>
                    )}
                    <div className="flex justify-center">
                        <button
                            onClick={handleToggleComplete}
                            className={checkBtnClass}
                            aria-pressed={Boolean(isDone)}
                            aria-label={lang === 'es' ? (isDone ? 'Serie completada' : 'Completar serie') : (isDone ? 'Set completed' : 'Complete set')}
                        >
                            <Icon name="Check" size={17} strokeWidth={isDone ? 3 : 2.5} />
                        </button>
                    </div>
                </div>
                {prescriptionHint && !isDone && (
                    <div className="flex justify-center pb-1 -mt-0.5">
                        <span className="text-[10px] font-bold tracking-wide text-primary-400">{prescriptionHint}</span>
                    </div>
                )}
            </div>
        );
    }

    // STANDARD GYM / CARDIO MODE
    return (
        <div id={`set-row-${set.id}`}
            onTouchStart={onSwipeTouchStart} onTouchMove={onSwipeTouchMove} onTouchEnd={onSwipeTouchEnd}
            onClick={handleRowClick}
            className={rowClass}>
            {SwipeOverlay}
            <div className={`grid ${showRIR ? 'grid-cols-[28px_38px_1fr_1fr_38px_36px]' : 'grid-cols-[28px_44px_1fr_1fr_36px]'} items-center gap-2 px-2.5 py-1.5`}>
                <div className="flex justify-center">
                    <BadgeEl {...badgeProps as any} className={badgeClass}>
                        {effectiveBadgeLabel}
                    </BadgeEl>
                </div>
                <div className="text-center text-[12px] text-muted tabular-nums truncate font-medium">
                    {prevText}
                </div>
                <div>
                    <input
                        ref={weightRef}
                        type="number" inputMode="decimal"
                        className={currentInputClass}
                        placeholder={weightPlaceholder}
                        value={localWeight}
                        onChange={e => {
                            setLocalWeight(e.target.value);
                            scheduleCommit('weight', e.target.value, 180);
                        }}
                        onKeyDown={handleWeightKeyDown}
                        onBlur={() => handleWeightBlur(localWeight)}
                        onFocus={() => activeFieldRef.current = 'weight'}
                        enterKeyHint="next"
                    />
                </div>
                <div>
                    <input
                        ref={repsRef}
                        type="number" inputMode="numeric"
                        className={currentInputClass}
                        placeholder={repsPlaceholder}
                        value={localReps}
                        onChange={e => {
                            setLocalReps(e.target.value);
                            scheduleCommit('reps', e.target.value, 180);
                        }}
                        onBlur={() => handleBlur('reps', localReps)}
                        onFocus={() => activeFieldRef.current = 'reps'}
                        enterKeyHint="done"
                    />
                </div>
                {showRIR && (
                    <div>
                        <input
                            type="number" inputMode="decimal"
                            className={currentInputClass}
                            placeholder="RIR"
                            value={localRpe}
                            onChange={e => {
                                setLocalRpe(e.target.value);
                                scheduleCommit('rpe', e.target.value, 180);
                            }}
                            onBlur={() => handleBlur('rpe', localRpe)}
                            enterKeyHint="done"
                        />
                    </div>
                )}
                <div className="flex justify-center">
                    <button
                        onClick={handleToggleComplete}
                        className={checkBtnClass}
                        aria-pressed={Boolean(isDone)}
                        aria-label={lang === 'es' ? (isDone ? 'Serie completada' : 'Completar serie') : (isDone ? 'Set completed' : 'Complete set')}
                    >
                        <Icon name="Check" size={17} strokeWidth={isDone ? 3 : 2.5} />
                    </button>
                </div>
            </div>
            {prescriptionHint && !isDone && (
                <div className="flex justify-center pb-1 -mt-0.5">
                    <span className="text-[10px] font-bold tracking-wide text-primary-400">{prescriptionHint}</span>
                </div>
            )}
        </div>
    );
});
